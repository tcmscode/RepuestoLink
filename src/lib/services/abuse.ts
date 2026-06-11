import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";

type AbuseAction =
  | "aviso"
  | "cooldown"
  | "revision_manual"
  | "bloqueo_temporal"
  | "bloqueo_permanente";

export async function checkBuyerCanConfirm(buyerCompanyId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const company = await prisma.company.findUnique({
    where: { id: buyerCompanyId },
  });
  if (!company) return { allowed: false, reason: "Empresa no encontrada" };
  if (company.kycStatus === "bloqueado") {
    return { allowed: false, reason: "Cuenta bloqueada" };
  }
  if (company.manualReviewRequired) {
    return {
      allowed: false,
      reason: "Cuenta en revisión manual por el administrador",
    };
  }
  if (company.cooldownUntil && company.cooldownUntil > new Date()) {
    return {
      allowed: false,
      reason: `Restricción activa hasta ${company.cooldownUntil.toLocaleDateString("es-AR")}`,
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const confirmationsToday = await prisma.order.count({
    where: {
      buyerCompanyId,
      confirmedAt: { gte: todayStart },
      status: { notIn: ["borrador", "cancelado"] },
    },
  });
  if (confirmationsToday >= BUSINESS_RULES.maxConfirmationsPerDay) {
    return {
      allowed: false,
      reason: "Límite diario de confirmaciones alcanzado",
    };
  }

  return { allowed: true };
}

export async function recordCancellationAndEvaluate(
  buyerCompanyId: string,
  orderId: string,
  hoursSinceConfirm: number
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cancellations = await prisma.order.count({
    where: {
      buyerCompanyId,
      status: "cancelado",
      confirmedAt: { gte: thirtyDaysAgo },
    },
  });

  let action: AbuseAction = "aviso";
  let signal = "cancelacion_post_confirmacion";
  let weight: "bajo" | "medio" | "alto" | "critico" = "medio";

  if (hoursSinceConfirm <= BUSINESS_RULES.criticalCancelWithinHours) {
    action = "bloqueo_temporal";
    signal = "confirmar_cancelar_rapido";
    weight = "critico";
    const cooldownEnd = new Date();
    cooldownEnd.setDate(cooldownEnd.getDate() + 30);
    await prisma.company.update({
      where: { id: buyerCompanyId },
      data: {
        cooldownUntil: cooldownEnd,
        trustScore: { decrement: 30 },
        manualReviewRequired: true,
      },
    });
  } else if (cancellations >= BUSINESS_RULES.suspensionCancellationsPer30Days) {
    action = "bloqueo_permanente";
    signal = "exceso_cancelaciones_30d";
    weight = "critico";
    await prisma.company.update({
      where: { id: buyerCompanyId },
      data: {
        kycStatus: "bloqueado",
        trustScore: 0,
        kycNotes: `Suspensión automática: ${cancellations} cancelaciones en 30 días`,
      },
    });
  } else if (cancellations > BUSINESS_RULES.maxConfirmedCancellationsPer30Days) {
    action = "revision_manual";
    signal = "multiples_cancelaciones_30d";
    weight = "alto";
    await prisma.company.update({
      where: { id: buyerCompanyId },
      data: {
        manualReviewRequired: true,
        trustScore: { decrement: 15 },
        kycNotes: "Revisión manual: más de 3 cancelaciones en 30 días",
      },
    });
  }

  await prisma.abuseEvent.create({
    data: {
      companyId: buyerCompanyId,
      signal,
      weight,
      action,
      metadata: JSON.stringify({ orderId, cancellations }),
    },
  });
}

export async function clearManualReview(companyId: string, adminEmail?: string) {
  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: companyId },
      data: { manualReviewRequired: false },
    });
    await tx.auditLog.create({
      data: {
        companyId,
        actorEmail: adminEmail,
        action: "MANUAL_REVIEW_CLEARED",
        entityType: "Company",
        entityId: companyId,
      },
    });
  });
}
