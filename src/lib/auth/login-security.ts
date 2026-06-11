import { prisma } from "@/lib/db";
import { BUSINESS_RULES } from "@/lib/config/business";

export async function checkLoginAllowed(
  email: string
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) return { allowed: true };

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      allowed: false,
      reason: `Cuenta bloqueada temporalmente. Intentá después de ${user.lockedUntil.toLocaleString("es-AR")}`,
    };
  }
  return { allowed: true };
}

export async function recordLoginFailure(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return;

  const attempts = user.failedLoginAttempts + 1;
  const data: { failedLoginAttempts: number; lockedUntil?: Date } = {
    failedLoginAttempts: attempts,
  };

  if (attempts >= BUSINESS_RULES.maxLoginAttempts) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(
      lockedUntil.getMinutes() + BUSINESS_RULES.loginLockoutMinutes
    );
    data.lockedUntil = lockedUntil;
    data.failedLoginAttempts = 0;
  }

  await prisma.user.update({ where: { id: user.id }, data });

  await prisma.auditLog.create({
    data: {
      actorEmail: normalized,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: JSON.stringify({ attempts, locked: !!data.lockedUntil }),
    },
  });
}

export async function recordLoginSuccess(userId: string, email: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: email,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: userId,
    },
  });
}
