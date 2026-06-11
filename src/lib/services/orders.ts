import { prisma } from "@/lib/db";
import { BUSINESS_RULES, COMMISSION_PERCENT } from "@/lib/config/business";
import {
  getPriceForCategory,
  invoiceDaysForCategory,
  isTradeCategory,
  type TradeCategory,
} from "@/lib/config/categories";
import { generateOrderNumber } from "@/lib/utils";
import { checkBuyerCanConfirm } from "./abuse";
import { calculateCommission } from "./commission";
import { notifyOrderBuyersAndSellers } from "./notifications";
import { onOrderClosed } from "./recategorization";
import { recordClosedOrderPair } from "./bridge-detection";

function commissionSnapshot(subtotal: number) {
  const { percent, amount } = calculateCommission(subtotal);
  return { percent, amount };
}

async function getBuyerTradeCategory(buyerCompanyId: string): Promise<TradeCategory> {
  const company = await prisma.company.findUnique({
    where: { id: buyerCompanyId },
    select: { tradeCategory: true },
  });
  if (company && isTradeCategory(company.tradeCategory)) {
    return company.tradeCategory;
  }
  return "B";
}

async function assertStockForOrderItems(
  items: { listingId: string; quantity: number; titleSnapshot: string }[]
) {
  for (const item of items) {
    const listing = await prisma.listing.findUnique({
      where: { id: item.listingId },
    });
    if (!listing || !listing.isActive) {
      throw new Error(`Publicación no disponible: ${item.titleSnapshot}`);
    }
    if (listing.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${item.titleSnapshot}" (disponible: ${listing.stock})`
      );
    }
  }
}

export async function restoreStockForOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await prisma.listing.update({
      where: { id: item.listingId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** Comprador confirma intención — precio inmutable, anonimato hasta aceptación del vendedor */
export async function confirmOrder(orderId: string, buyerCompanyId: string) {
  const canConfirm = await checkBuyerCanConfirm(buyerCompanyId);
  if (!canConfirm.allowed) {
    throw new Error(canConfirm.reason ?? "No puede confirmar");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerCompanyId, status: "borrador" },
    include: { items: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  await assertStockForOrderItems(order.items);

  const paymentCategory = await getBuyerTradeCategory(buyerCompanyId);
  const now = new Date();
  const { percent, amount } = commissionSnapshot(order.subtotal);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "pendiente_vendedor",
      buyerConfirmedAt: now,
      paymentCategory,
      commissionPercent: percent,
      commissionAmount: amount,
    },
    include: {
      sellerCompany: true,
      buyerCompany: true,
      items: true,
    },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Intención registrada",
      body: `Pedido ${updated.orderNumber} enviado al vendedor. Te avisamos cuando acepte.`,
    },
    {
      title: "Nueva solicitud de compra",
      body: `Pedido ${updated.orderNumber} pendiente de tu aceptación. Condición: cat. ${paymentCategory}.`,
      link: "/vendedor/pedidos",
    }
  );

  return updated;
}

/** Vendedor acepta — se revelan identidades y se reserva stock */
export async function acceptOrderBySeller(orderId: string, sellerCompanyId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerCompanyId,
      status: "pendiente_vendedor",
    },
    include: { items: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  await assertStockForOrderItems(order.items);

  const now = new Date();
  const disputeEnds = new Date(
    now.getTime() + BUSINESS_RULES.disputeWindowHours * 60 * 60 * 1000
  );

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const listing = await tx.listing.findUnique({ where: { id: item.listingId } });
      if (!listing || listing.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${item.titleSnapshot}"`);
      }
      await tx.listing.update({
        where: { id: item.listingId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "confirmado",
        sellerAcceptedAt: now,
        confirmedAt: now,
        disputeWindowEndsAt: disputeEnds,
        invoiceDeadlineAt: null,
      },
      include: {
        sellerCompany: true,
        buyerCompany: true,
        items: true,
      },
    });
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Compra confirmada",
      body: `El vendedor aceptó el pedido ${updated.orderNumber}. Ya podés ver sus datos de contacto.`,
    },
    {
      title: "Pedido aceptado",
      body: `Aceptaste el pedido ${updated.orderNumber}. Coordiná entrega con el comprador.`,
      link: "/vendedor/pedidos",
    }
  );

  return updated;
}

export async function rejectOrderBySeller(
  orderId: string,
  sellerCompanyId: string,
  reason?: string
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerCompanyId,
      status: "pendiente_vendedor",
    },
  });
  if (!order) throw new Error("Pedido no encontrado");

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "cancelado",
      cancelledAt: new Date(),
      cancelReason: reason ?? "Rechazado por vendedor",
    },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Pedido rechazado",
      body: `El vendedor rechazó el pedido ${updated.orderNumber}.`,
    },
    {
      title: "Pedido rechazado",
      body: `Rechazaste el pedido ${updated.orderNumber}.`,
    }
  );

  return updated;
}

export async function markOrderDelivered(orderId: string, sellerCompanyId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerCompanyId,
      status: "confirmado",
    },
    include: { items: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  const maxDays = Math.min(
    Math.max(...order.items.map((i) => i.invoiceDeadlineDays)),
    BUSINESS_RULES.maxInvoiceDeadlineDays
  );
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + maxDays);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "factura_pendiente",
      deliveredAt: new Date(),
      invoiceDeadlineAt: deadline,
    },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Pedido entregado",
      body: `El vendedor marcó como entregado el pedido ${updated.orderNumber}.`,
    },
    {
      title: "Entrega registrada",
      body: `Registraste la entrega del pedido ${updated.orderNumber}. Subí la factura a tiempo.`,
      link: "/vendedor/pedidos",
    }
  );

  return updated;
}

export async function submitInvoice(
  orderId: string,
  sellerCompanyId: string,
  data: {
    filePath?: string;
    numeroFactura?: string;
    cae?: string;
    monto?: number;
    manualEntry?: boolean;
  }
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      sellerCompanyId,
      status: "factura_pendiente",
    },
  });
  if (!order) throw new Error("Pedido no encontrado o no requiere factura");

  const submittedAt = new Date();

  await prisma.invoice.upsert({
    where: { orderId },
    create: {
      orderId,
      ...data,
      submittedAt,
      adminApproved: null,
    },
    update: {
      ...data,
      submittedAt,
      adminApproved: null,
      adminNotes: null,
    },
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "factura_revision" },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Factura enviada",
      body: `El vendedor cargó la factura del pedido ${updated.orderNumber}. En revisión.`,
    },
    {
      title: "Factura enviada",
      body: `Tu factura del pedido ${updated.orderNumber} está en revisión por el administrador.`,
      link: "/vendedor/pedidos",
    }
  );

  return updated;
}

export async function approveInvoice(orderId: string, adminNotes?: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "factura_revision" },
    include: { invoice: true },
  });
  if (!order?.invoice?.submittedAt) {
    throw new Error("Pedido sin factura pendiente de revisión");
  }

  const { percent, amount } = calculateCommission(order.subtotal);

  const now = new Date();

  await prisma.invoice.update({
    where: { orderId },
    data: { adminApproved: true, adminNotes },
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "cerrado",
      closedAt: now,
      commissionPercent: percent,
      commissionAmount: amount,
    },
  });

  await prisma.commission.upsert({
    where: { orderId },
    create: { orderId, percent, amount, status: "pendiente" },
    update: { percent, amount },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Venta cerrada",
      body: `El pedido ${updated.orderNumber} fue cerrado. Podés calificar al vendedor.`,
      link: `/comprador/pedidos/${updated.id}`,
    },
    {
      title: "Factura aprobada",
      body: `Factura del pedido ${updated.orderNumber} aprobada. Calificá al comprador.`,
      link: `/vendedor/pedidos`,
    }
  );

  await onOrderClosed(updated.buyerCompanyId);
  await recordClosedOrderPair(updated.buyerCompanyId, updated.sellerCompanyId);

  return updated;
}

export async function rejectInvoice(orderId: string, adminNotes: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "factura_revision" },
  });
  if (!order) throw new Error("Pedido no encontrado");

  await prisma.invoice.update({
    where: { orderId },
    data: { adminApproved: false, adminNotes },
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "factura_pendiente" },
  });

  await notifyOrderBuyersAndSellers(
    updated.id,
    updated.buyerCompanyId,
    updated.sellerCompanyId,
    {
      title: "Factura rechazada",
      body: `La factura del pedido ${updated.orderNumber} fue rechazada. El vendedor debe reenviarla.`,
    },
    {
      title: "Factura rechazada",
      body: `Revisá y volvé a cargar la factura del pedido ${updated.orderNumber}. Motivo: ${adminNotes}`,
      link: "/vendedor/pedidos",
    }
  );

  return updated;
}

export async function createOrderFromCart(
  buyerCompanyId: string,
  userId: string,
  sellerCompanyId: string
) {
  const paymentCategory = await getBuyerTradeCategory(buyerCompanyId);

  const seller = await prisma.company.findUnique({
    where: { id: sellerCompanyId, role: "vendedor" },
  });
  if (!seller) throw new Error("Vendedor no encontrado");
  if (seller.tradeCategory !== paymentCategory) {
    throw new Error(
      "Este vendedor no opera con tu categoría de pago actual"
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { listing: true },
  });

  const sellerItems = cartItems.filter(
    (c) => c.listing.companyId === sellerCompanyId && c.listing.isActive
  );
  if (sellerItems.length === 0) throw new Error("Carrito vacío para este vendedor");

  for (const item of sellerItems) {
    const unitPrice = getPriceForCategory(item.listing, paymentCategory);
    if (unitPrice == null) {
      throw new Error(
        `Sin precio para tu categoría en "${item.listing.title}"`
      );
    }
    if (item.listing.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para "${item.listing.title}" (disponible: ${item.listing.stock})`
      );
    }
  }

  const subtotal = sellerItems.reduce((sum, item) => {
    const unitPrice = getPriceForCategory(item.listing, paymentCategory)!;
    return sum + unitPrice * item.quantity;
  }, 0);
  const { percent, amount } = commissionSnapshot(subtotal);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      buyerCompanyId,
      sellerCompanyId,
      status: "borrador",
      subtotal,
      paymentCategory,
      commissionPercent: percent,
      commissionAmount: amount,
      items: {
        create: sellerItems.map((item) => {
          const unitPrice = getPriceForCategory(item.listing, paymentCategory)!;
          return {
            listingId: item.listingId,
            titleSnapshot: item.listing.title,
            priceSnapshot: unitPrice,
            quantity: item.quantity,
            invoiceDeadlineDays: invoiceDaysForCategory(paymentCategory),
          };
        }),
      },
    },
    include: { items: true, sellerCompany: true },
  });

  await prisma.cartItem.deleteMany({
    where: {
      userId,
      listingId: { in: sellerItems.map((s) => s.listingId) },
    },
  });

  return order;
}

export { COMMISSION_PERCENT };
