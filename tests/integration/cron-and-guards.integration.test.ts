import { afterAll, beforeAll, expect, it } from "vitest";
import { describeIntegration } from "../helpers/skip-if-no-db";
import { initIntegrationDb, skipIfNoDb } from "../helpers/setup-suite";
import {
  deleteOrderCascade,
  disconnectTestDb,
  loadDemoContext,
  testPrisma,
  type DemoContext,
} from "../helpers/db";
import { processOverdueInvoices } from "@/lib/services/invoices-cron";

describeIntegration("cron facturas vencidas", () => {
  let ctx: DemoContext | undefined;
  let orderId: string | undefined;
  let originalKyc = "aprobado";

  beforeAll(async () => {
    if (!(await initIntegrationDb())) return;
    ctx = await loadDemoContext();

    const seller = await testPrisma.company.findUniqueOrThrow({
      where: { id: ctx.seller2CompanyId },
    });
    originalKyc = seller.kycStatus;

    const listing = await testPrisma.listing.findFirstOrThrow({
      where: { companyId: ctx.seller2CompanyId, stock: { gt: 0 } },
    });

    const order = await testPrisma.order.create({
      data: {
        orderNumber: `TEST-OVERDUE-${Date.now()}`,
        buyerCompanyId: ctx.buyerCompanyId,
        sellerCompanyId: ctx.seller2CompanyId,
        status: "factura_pendiente",
        subtotal: 1000,
        commissionPercent: 2,
        commissionAmount: 20,
        paymentCategory: "B",
        invoiceDeadlineAt: new Date(Date.now() - 86400000),
        items: {
          create: {
            listingId: listing.id,
            titleSnapshot: listing.title,
            priceSnapshot: 1000,
            quantity: 1,
            invoiceDeadlineDays: 30,
          },
        },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    if (orderId) await deleteOrderCascade(orderId);
    if (ctx) {
      await testPrisma.company.update({
        where: { id: ctx.seller2CompanyId },
        data: { kycStatus: originalKyc },
      });
    }
    await disconnectTestDb();
  });

  it("marca disputado y bloquea vendedor sin factura", async (t) => {
    skipIfNoDb(t);
    const results = await processOverdueInvoices();
    expect(results.some((r) => r.orderId === orderId)).toBe(true);

    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: orderId! },
    });
    expect(order.status).toBe("disputado");

    const seller = await testPrisma.company.findUniqueOrThrow({
      where: { id: ctx!.seller2CompanyId },
    });
    expect(seller.kycStatus).toBe("bloqueado");
  });
});

describeIntegration("rechazo de categoría cruzada", () => {
  let ctx: DemoContext | undefined;

  beforeAll(async () => {
    if (!(await initIntegrationDb())) return;
    ctx = await loadDemoContext();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("impide pedido a vendedor de otra categoría", async (t) => {
    skipIfNoDb(t);
    const { createOrderFromCart } = await import("@/lib/services/orders");

    const sellerA = await testPrisma.company.create({
      data: {
        cuit: `30-7999999${Date.now().toString().slice(-2)}-9`,
        razonSocial: "Test Seller Cat A",
        kycStatus: "aprobado",
        role: "vendedor",
        tradeCategory: "A",
      },
    });

    const listing = await testPrisma.listing.create({
      data: {
        companyId: sellerA.id,
        sku: `TEST-SKU-${Date.now()}`,
        title: "Repuesto test cat A",
        price: 1000,
        priceContado: 1000,
        price30: 1050,
        stock: 5,
      },
    });

    await testPrisma.cartItem.create({
      data: {
        userId: ctx!.buyerUserId,
        listingId: listing.id,
        quantity: 1,
      },
    });

    await expect(
      createOrderFromCart(ctx!.buyerCompanyId, ctx!.buyerUserId, sellerA.id)
    ).rejects.toThrow(/categoría/i);

    await testPrisma.cartItem.deleteMany({
      where: { userId: ctx!.buyerUserId, listingId: listing.id },
    });
    await testPrisma.listing.delete({ where: { id: listing.id } });
    await testPrisma.company.delete({ where: { id: sellerA.id } });
  });
});
