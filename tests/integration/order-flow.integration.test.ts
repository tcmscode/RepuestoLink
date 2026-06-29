import { afterAll, beforeAll, expect, it } from "vitest";
import { describeIntegration } from "../helpers/skip-if-no-db";
import { initIntegrationDb, skipIfNoDb } from "../helpers/setup-suite";
import {
  clearBuyerCart,
  deleteOrderCascade,
  disconnectTestDb,
  loadDemoContext,
  testPrisma,
  type DemoContext,
} from "../helpers/db";
import {
  acceptOrderBySeller,
  approveInvoice,
  confirmOrder,
  createOrderFromCart,
  markOrderDelivered,
  submitInvoice,
} from "@/lib/services/orders";
import { submitRating } from "@/lib/services/ratings";
import { calculateCommission } from "@/lib/services/commission";

describeIntegration("flujo completo de pedido", () => {
  let ctx: DemoContext | undefined;
  let orderId: string | undefined;
  let frozenSubtotal = 0;

  beforeAll(async () => {
    if (!(await initIntegrationDb())) return;
    ctx = await loadDemoContext();
    await clearBuyerCart(ctx.buyerUserId);

    const listing = await testPrisma.listing.findFirstOrThrow({
      where: {
        sku: "FILT-AIR-IVECO",
        companyId: ctx.seller1CompanyId,
        stock: { gt: 0 },
      },
    });

    await testPrisma.cartItem.create({
      data: {
        userId: ctx.buyerUserId,
        listingId: listing.id,
        quantity: 1,
      },
    });
  });

  afterAll(async () => {
    if (orderId) await deleteOrderCascade(orderId);
    if (ctx) await clearBuyerCart(ctx.buyerUserId);
    await disconnectTestDb();
  });

  it("1. crea pedido borrador desde carrito", async (t) => {
    skipIfNoDb(t);
    const order = await createOrderFromCart(
      ctx!.buyerCompanyId,
      ctx!.buyerUserId,
      ctx!.seller1CompanyId
    );
    orderId = order.id;
    frozenSubtotal = order.subtotal;
    expect(order.status).toBe("borrador");
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.items[0].priceSnapshot).toBeGreaterThan(0);
  });

  it("2. comprador confirma intención → pendiente_vendedor", async (t) => {
    skipIfNoDb(t);
    const updated = await confirmOrder(orderId!, ctx!.buyerCompanyId);
    expect(updated.status).toBe("pendiente_vendedor");
    expect(updated.commissionPercent).toBe(2);
    expect(updated.paymentCategory).toBe("B");
  });

  it("3. vendedor acepta → confirmado y descuenta stock", async (t) => {
    skipIfNoDb(t);
    const item = await testPrisma.orderItem.findFirstOrThrow({
      where: { orderId: orderId! },
    });
    const beforeStock = (
      await testPrisma.listing.findUniqueOrThrow({
        where: { id: item.listingId },
      })
    ).stock;

    const updated = await acceptOrderBySeller(orderId!, ctx!.seller1CompanyId);
    expect(updated.status).toBe("confirmado");
    expect(updated.sellerAcceptedAt).toBeTruthy();

    const afterStock = (
      await testPrisma.listing.findUniqueOrThrow({
        where: { id: item.listingId },
      })
    ).stock;
    expect(afterStock).toBe(beforeStock - item.quantity);
  });

  it("4. vendedor marca entregado → factura_pendiente", async (t) => {
    skipIfNoDb(t);
    const updated = await markOrderDelivered(orderId!, ctx!.seller1CompanyId);
    expect(updated.status).toBe("factura_pendiente");
    expect(updated.invoiceDeadlineAt).toBeTruthy();
  });

  it("5. vendedor carga factura → factura_revision", async (t) => {
    skipIfNoDb(t);
    const updated = await submitInvoice(orderId!, ctx!.seller1CompanyId, {
      numeroFactura: "TEST-0001",
      cae: "12345678901234",
      monto: frozenSubtotal,
      manualEntry: true,
    });
    expect(updated.status).toBe("factura_revision");
  });

  it("6. admin aprueba → cerrado con comisión 2%", async (t) => {
    skipIfNoDb(t);
    const updated = await approveInvoice(orderId!, "Aprobado en test automático");
    expect(updated.status).toBe("cerrado");

    const commission = await testPrisma.commission.findUniqueOrThrow({
      where: { orderId: orderId! },
    });
    const expected = calculateCommission(frozenSubtotal);
    expect(commission.percent).toBe(expected.percent);
    expect(commission.amount).toBe(expected.amount);
    expect(commission.status).toBe("pendiente");
  });

  it("7. ambas partes califican post-cierre", async (t) => {
    skipIfNoDb(t);
    await submitRating(orderId!, ctx!.buyerCompanyId, 5, "Excelente");
    await submitRating(orderId!, ctx!.seller1CompanyId, 4);

    const ratings = await testPrisma.transactionRating.findMany({
      where: { orderId: orderId! },
    });
    expect(ratings).toHaveLength(2);
  });

  it("8. precio congelado no cambió durante el flujo", async (t) => {
    skipIfNoDb(t);
    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: orderId! },
      include: { items: true },
    });
    expect(order.subtotal).toBe(frozenSubtotal);
    const itemTotal = order.items.reduce(
      (s, i) => s + i.priceSnapshot * i.quantity,
      0
    );
    expect(itemTotal).toBe(frozenSubtotal);
  });
});
