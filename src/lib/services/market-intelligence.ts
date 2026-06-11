import { prisma } from "@/lib/db";

/** Datos anonimizados de demanda para el panel de inteligencia comercial (Pilar 6) */
export async function getSellerMarketInsights(sellerCompanyId: string) {
  const listings = await prisma.listing.findMany({
    where: { companyId: sellerCompanyId, isActive: true },
    select: { sku: true, title: true, brand: true },
  });
  const skus = listings.map((l) => l.sku);

  const searchCounts = await prisma.searchHistory.groupBy({
    by: ["query"],
    _count: true,
    orderBy: { _count: { query: "desc" } },
    take: 15,
  });

  const relevantSearches = searchCounts.filter((s) => {
    const q = s.query.toLowerCase();
    return listings.some(
      (l) =>
        q.includes(l.sku.toLowerCase()) ||
        (l.brand && q.includes(l.brand.toLowerCase())) ||
        l.title.toLowerCase().split(q)
    );
  });

  const closedOrders = await prisma.order.findMany({
    where: {
      sellerCompanyId,
      status: "cerrado",
    },
    select: { subtotal: true, paymentCategory: true, buyerCompany: { select: { provincia: true } } },
    take: 200,
  });

  const byProvince = closedOrders.reduce(
    (acc, o) => {
      const p = o.buyerCompany.provincia ?? "Sin dato";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const priceRanges = closedOrders.length
    ? {
        min: Math.min(...closedOrders.map((o) => o.subtotal)),
        max: Math.max(...closedOrders.map((o) => o.subtotal)),
        avg:
          closedOrders.reduce((s, o) => s + o.subtotal, 0) /
          closedOrders.length,
      }
    : null;

  return {
    topSearches: relevantSearches.slice(0, 8).map((s) => ({
      query: s.query,
      count: s._count,
    })),
    demandByProvince: Object.entries(byProvince)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([provincia, pedidos]) => ({ provincia, pedidos })),
    closedDealsCount: closedOrders.length,
    priceRanges,
    activeSkus: skus.length,
  };
}
