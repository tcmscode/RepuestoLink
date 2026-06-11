import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";
import type { TradeCategory } from "@/lib/config/categories";
import { isTradeCategory } from "@/lib/config/categories";

function categoryFromPaymentHistory(
  categories: string[]
): TradeCategory | null {
  if (categories.length === 0) return null;
  const counts = categories.reduce(
    (acc, c) => {
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0];
  return isTradeCategory(top) ? top : null;
}

export async function evaluateBuyerRecategorization(buyerCompanyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: buyerCompanyId, role: "comprador" },
  });
  if (!company) return null;

  const closed = await prisma.order.findMany({
    where: { buyerCompanyId, status: "cerrado" },
    select: { paymentCategory: true },
    orderBy: { closedAt: "desc" },
    take: 20,
  });

  if (closed.length < BUSINESS_RULES.recategorizationMinClosedOrders) {
    return null;
  }

  const suggested = categoryFromPaymentHistory(
    closed
      .map((o) => o.paymentCategory)
      .filter((c): c is string => !!c)
  );

  if (!suggested || suggested === company.tradeCategory) {
    await prisma.company.update({
      where: { id: buyerCompanyId },
      data: { categoryReviewAt: new Date() },
    });
    return { changed: false, suggested, current: company.tradeCategory };
  }

  const previous = company.tradeCategory;
  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: buyerCompanyId },
      data: {
        tradeCategory: suggested,
        categoryReviewAt: new Date(),
        closedOrdersCount: closed.length,
      },
    });
    await tx.auditLog.create({
      data: {
        companyId: buyerCompanyId,
        action: "RECATEGORIZACION_AUTO",
        entityType: "Company",
        entityId: buyerCompanyId,
        metadata: JSON.stringify({ from: previous, to: suggested, orders: closed.length }),
      },
    });
  });

  return { changed: true, suggested, previous, current: suggested };
}

export async function runPeriodicCategoryReview() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - BUSINESS_RULES.recategorizationReviewDays);

  const companies = await prisma.company.findMany({
    where: {
      role: "comprador",
      kycStatus: "aprobado",
      OR: [{ categoryReviewAt: null }, { categoryReviewAt: { lt: cutoff } }],
    },
    select: { id: true },
    take: 200,
  });

  let updated = 0;
  for (const c of companies) {
    const result = await evaluateBuyerRecategorization(c.id);
    if (result?.changed) updated++;
  }
  return { scanned: companies.length, recategorized: updated };
}

export async function onOrderClosed(buyerCompanyId: string) {
  const count = await prisma.order.count({
    where: { buyerCompanyId, status: "cerrado" },
  });
  await prisma.company.update({
    where: { id: buyerCompanyId },
    data: { closedOrdersCount: count },
  });
  if (count >= BUSINESS_RULES.recategorizationMinClosedOrders) {
    await evaluateBuyerRecategorization(buyerCompanyId);
  }
}
