import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";
import { hashPassword } from "@/lib/auth/password";
import { verifyCuitWithAfip } from "@/lib/services/tax/verify-cuit";
import { generateOrderNumber } from "@/lib/utils";
import crypto from "crypto";

export async function countAccessRequestsThisMonth(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.accessRequest.count({
    where: { createdAt: { gte: start } },
  });
}

export async function isAutomationThresholdReached(): Promise<boolean> {
  const count = await countAccessRequestsThisMonth();
  return count >= BUSINESS_RULES.monthlyAccessRequestsAutomationThreshold;
}

function tempPassword() {
  return `RL-${crypto.randomBytes(4).toString("hex")}-${crypto.randomBytes(2).toString("hex")}!`;
}

export async function maybeAutoProvisionAccessRequest(requestId: string) {
  const thresholdReached = await isAutomationThresholdReached();
  const forceAutomation = process.env.ACCESS_AUTOMATION_ENABLED === "true";
  if (!thresholdReached && !forceAutomation) {
    return { provisioned: false, reason: "umbral_no_alcanzado" };
  }

  const request = await prisma.accessRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.status !== "pendiente" || request.autoProvisioned) {
    return { provisioned: false, reason: "solicitud_no_elegible" };
  }

  const afip = await verifyCuitWithAfip(
    request.cuit,
    request.roleRequested as "comprador" | "vendedor",
    request.razonSocial
  );
  if (!afip.ok || !afip.activityValid || !afip.data) {
    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        afipVerified: afip.ok,
        afipDataJson: afip.data ? JSON.stringify(afip.data) : null,
        adminNotes: afip.error ?? "Actividad no compatible con el rol solicitado",
      },
    });
    return { provisioned: false, reason: afip.error ?? "actividad_invalida" };
  }

  const existingCuit = await prisma.company.findUnique({
    where: { cuit: afip.data.cuit },
  });
  if (existingCuit) {
    return { provisioned: false, reason: "cuit_ya_registrado" };
  }

  const email = request.email.toLowerCase();
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { provisioned: false, reason: "email_ya_registrado" };
  }

  const password = tempPassword();
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        cuit: afip.data!.cuit,
        razonSocial: afip.data!.razonSocial,
        nombreFantasia: request.nombreFantasia,
        telefono: request.telefono,
        role: request.roleRequested,
        tradeCategory: request.tradeCategory,
        kycStatus: "aprobado",
        afipVerifiedAt: new Date(),
        afipDataJson: JSON.stringify(afip.data),
      },
    });

    await tx.user.create({
      data: {
        email,
        name: request.razonSocial.slice(0, 80),
        passwordHash,
        companyId: company.id,
      },
    });

    await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: "aprobado",
        afipVerified: true,
        afipDataJson: JSON.stringify(afip.data),
        autoProvisioned: true,
        adminNotes: `Alta automática. Contraseña temporal: ${password} (cambiar al ingresar)`,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        action: "ACCESS_AUTO_PROVISION",
        entityType: "AccessRequest",
        entityId: requestId,
        metadata: JSON.stringify({ email, automation: true }),
      },
    });
  });

  return { provisioned: true, email, tempPassword: password };
}
