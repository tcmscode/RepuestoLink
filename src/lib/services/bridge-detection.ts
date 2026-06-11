import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";

export async function recordClosedOrderPair(
  buyerCompanyId: string,
  sellerCompanyId: string
) {
  const now = new Date();
  const pair = await prisma.tradingPair.upsert({
    where: {
      buyerCompanyId_sellerCompanyId: { buyerCompanyId, sellerCompanyId },
    },
    create: {
      buyerCompanyId,
      sellerCompanyId,
      closedCount: 1,
      lastClosedAt: now,
    },
    update: {
      closedCount: { increment: 1 },
      lastClosedAt: now,
    },
  });

  const windowStart = new Date();
  windowStart.setDate(
    windowStart.getDate() - BUSINESS_RULES.bridgePairWindowDays
  );

  if (
    pair.closedCount >= BUSINESS_RULES.bridgePairClosedThreshold &&
    !pair.blockedAt
  ) {
    await flagBridgePair(pair.id, buyerCompanyId, sellerCompanyId, pair.closedCount);
  }

  return pair;
}

async function flagBridgePair(
  pairId: string,
  buyerCompanyId: string,
  sellerCompanyId: string,
  count: number
) {
  const now = new Date();
  await prisma.tradingPair.update({
    where: { id: pairId },
    data: { flaggedAt: now },
  });

  for (const companyId of [buyerCompanyId, sellerCompanyId]) {
    await prisma.abuseEvent.create({
      data: {
        companyId,
        signal: "puenteo_mismo_par",
        weight: "critico",
        action: "revision_manual",
        metadata: JSON.stringify({
          pairId,
          buyerCompanyId,
          sellerCompanyId,
          closedCount: count,
        }),
      },
    });
    await prisma.company.update({
      where: { id: companyId },
      data: { manualReviewRequired: true },
    });
  }
}

export async function blockBridgePairPermanently(
  buyerCompanyId: string,
  sellerCompanyId: string,
  adminEmail?: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.tradingPair.updateMany({
      where: { buyerCompanyId, sellerCompanyId },
      data: { blockedAt: new Date() },
    });

    for (const id of [buyerCompanyId, sellerCompanyId]) {
      await tx.company.update({
        where: { id },
        data: {
          kycStatus: "bloqueado",
          listingsSuspended: true,
          trustScore: 0,
          kycNotes: "Bloqueo por puenteo detectado — historial perdido",
          tradeCategory: "D",
        },
      });
      await tx.listing.updateMany({
        where: { companyId: id },
        data: { isActive: false },
      });
      await tx.abuseEvent.create({
        data: {
          companyId: id,
          signal: "puenteo_bloqueo_permanente",
          weight: "critico",
          action: "bloqueo_permanente",
          metadata: JSON.stringify({ buyerCompanyId, sellerCompanyId }),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorEmail: adminEmail,
        action: "BRIDGE_BLOCK_PERMANENT",
        entityType: "TradingPair",
        metadata: JSON.stringify({ buyerCompanyId, sellerCompanyId }),
      },
    });
  });
}

export async function getFlaggedTradingPairs(limit = 50) {
  return prisma.tradingPair.findMany({
    where: { flaggedAt: { not: null }, blockedAt: null },
    include: {
      buyerCompany: { select: { razonSocial: true, cuit: true } },
      sellerCompany: { select: { razonSocial: true, cuit: true } },
    },
    orderBy: { closedCount: "desc" },
    take: limit,
  });
}
