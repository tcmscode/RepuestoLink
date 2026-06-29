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
import { searchListingsForBuyer } from "@/lib/policies/listings";
import { BUYER_NAME, SELLER_NAMES } from "../helpers/constants";

describeIntegration("anonimato en catálogo", () => {
  let ctx: DemoContext | undefined;

  beforeAll(async () => {
    if (!(await initIntegrationDb())) return;
    ctx = await loadDemoContext();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("no expone razón social del vendedor en búsqueda", async (t) => {
    skipIfNoDb(t);
    const result = await searchListingsForBuyer({
      q: "Scania",
      buyerCompanyId: ctx!.buyerCompanyId,
      pageSize: 12,
    });

    expect(result.listings.length).toBeGreaterThan(0);
    for (const listing of result.listings) {
      expect(listing.sellerName).toBeUndefined();
      expect(listing.sellerCompanyId).toBeUndefined();
      expect(listing.sellerPhone).toBeUndefined();
    }

    const html = JSON.stringify(result.listings);
    expect(html).not.toContain(SELLER_NAMES.repuestosDelSur);
    expect(html).not.toContain(SELLER_NAMES.busParts);
  });

  it("ordena por precio ascendente cuando sort=price_asc", async (t) => {
    skipIfNoDb(t);
    const result = await searchListingsForBuyer({
      q: "diferencial",
      buyerCompanyId: ctx!.buyerCompanyId,
      sort: "price_asc",
      pageSize: 24,
    });

    const prices = result.listings.map((l) => l.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it("solo muestra vendedores de la misma categoría que el comprador", async (t) => {
    skipIfNoDb(t);
    const buyer = await testPrisma.company.findUniqueOrThrow({
      where: { id: ctx!.buyerCompanyId },
    });
    expect(buyer.tradeCategory).toBe("B");

    const result = await searchListingsForBuyer({
      buyerCompanyId: ctx!.buyerCompanyId,
      pageSize: 48,
    });

    for (const listing of result.listings) {
      const seller = await testPrisma.listing.findUnique({
        where: { id: listing.id },
        include: { company: { select: { tradeCategory: true } } },
      });
      expect(seller?.company.tradeCategory).toBe("B");
    }
  });
});

describeIntegration("anonimato en pedidos pendiente_vendedor", () => {
  let ctx: DemoContext | undefined;
  let orderId: string | undefined;

  beforeAll(async () => {
    if (!(await initIntegrationDb())) return;
    ctx = await loadDemoContext();
    await clearBuyerCart(ctx.buyerUserId);

    const listing = await testPrisma.listing.findFirstOrThrow({
      where: {
        sku: "SCANIA-PAST-FREN",
        companyId: ctx.seller2CompanyId,
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

    const { createOrderFromCart, confirmOrder } = await import(
      "@/lib/services/orders"
    );
    const order = await createOrderFromCart(
      ctx.buyerCompanyId,
      ctx.buyerUserId,
      ctx.seller2CompanyId
    );
    orderId = order.id;
    await confirmOrder(orderId, ctx.buyerCompanyId);
  });

  afterAll(async () => {
    if (orderId) await deleteOrderCascade(orderId);
    if (ctx) await clearBuyerCart(ctx.buyerUserId);
    await disconnectTestDb();
  });

  it("pedido queda en pendiente_vendedor con comprador identificable solo en DB", async (t) => {
    skipIfNoDb(t);
    const order = await testPrisma.order.findUniqueOrThrow({
      where: { id: orderId! },
      include: { buyerCompany: true },
    });
    expect(order.status).toBe("pendiente_vendedor");
    expect(order.buyerCompany.razonSocial).toBe(BUYER_NAME);
  });
});
