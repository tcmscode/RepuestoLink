import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";

export async function submitRating(
  orderId: string,
  fromCompanyId: string,
  stars: number,
  comment?: string
) {
  if (stars < 1 || stars > 5) {
    throw new Error("La calificación debe ser entre 1 y 5 estrellas");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: "cerrado" },
  });
  if (!order) throw new Error("Pedido no encontrado o no cerrado");

  const isBuyer = order.buyerCompanyId === fromCompanyId;
  const isSeller = order.sellerCompanyId === fromCompanyId;
  if (!isBuyer && !isSeller) {
    throw new Error("No autorizado para calificar este pedido");
  }

  const toCompanyId = isBuyer ? order.sellerCompanyId : order.buyerCompanyId;

  const existing = await prisma.transactionRating.findUnique({
    where: {
      orderId_fromCompanyId: { orderId, fromCompanyId },
    },
  });
  if (existing) throw new Error("Ya calificaste este pedido");

  await prisma.$transaction(async (tx) => {
    await tx.transactionRating.create({
      data: {
        orderId,
        fromCompanyId,
        toCompanyId,
        stars,
        comment: comment?.trim() || null,
      },
    });

    const agg = await tx.transactionRating.aggregate({
      where: { toCompanyId },
      _avg: { stars: true },
      _count: true,
    });

    await tx.company.update({
      where: { id: toCompanyId },
      data: {
        avgRating: agg._avg.stars ?? stars,
        ratingCount: agg._count,
        ...(agg._avg.stars != null && agg._avg.stars < 2
          ? { manualReviewRequired: true, kycNotes: "Revisión manual por calificación baja" }
          : {}),
      },
    });
  });

  return { ok: true };
}

export async function getPendingRatingsForCompany(companyId: string) {
  const reminderCutoff = new Date();
  reminderCutoff.setHours(
    reminderCutoff.getHours() - BUSINESS_RULES.ratingReminderHours
  );

  const asBuyer = await prisma.order.findMany({
    where: {
      buyerCompanyId: companyId,
      status: "cerrado",
      closedAt: { lte: reminderCutoff },
      ratings: { none: { fromCompanyId: companyId } },
    },
    select: {
      id: true,
      orderNumber: true,
      sellerCompany: { select: { razonSocial: true } },
    },
    orderBy: { closedAt: "desc" },
    take: 5,
  });

  const asSeller = await prisma.order.findMany({
    where: {
      sellerCompanyId: companyId,
      status: "cerrado",
      closedAt: { lte: reminderCutoff },
      ratings: { none: { fromCompanyId: companyId } },
    },
    select: {
      id: true,
      orderNumber: true,
      buyerCompany: { select: { razonSocial: true } },
    },
    orderBy: { closedAt: "desc" },
    take: 5,
  });

  return { asBuyer, asSeller };
}

export async function getRatingsForCompany(companyId: string, limit = 10) {
  return prisma.transactionRating.findMany({
    where: { toCompanyId: companyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      order: { select: { orderNumber: true } },
    },
  });
}
