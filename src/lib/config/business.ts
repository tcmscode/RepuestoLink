/**
 * Reglas de negocio RepuestoLink / AppPesados (web B2B Argentina)
 */

export const ALLOWED_INVOICE_DEADLINE_DAYS = [15, 30, 60, 90] as const;
export type InvoiceDeadlineDays = (typeof ALLOWED_INVOICE_DEADLINE_DAYS)[number];
export const MAX_INVOICE_DEADLINE_DAYS = 90;

/** Comisión fija sobre ventas cerradas con factura */
export const COMMISSION_PERCENT = Number(process.env.COMMISSION_PERCENT ?? 2);

export const BUSINESS_RULES = {
  allowedInvoiceDeadlineDays: ALLOWED_INVOICE_DEADLINE_DAYS,
  maxInvoiceDeadlineDays: MAX_INVOICE_DEADLINE_DAYS,
  commissionPercent: COMMISSION_PERCENT,

  disputeWindowHours: Number(process.env.DISPUTE_WINDOW_HOURS ?? 72),

  /** Anti-abuso: >3 cancelaciones/30d → revisión manual; >5 → suspensión */
  maxConfirmedCancellationsPer30Days: 3,
  suspensionCancellationsPer30Days: 5,
  abuseCooldownDays: 7,
  maxConfirmationsPerDay: 5,
  criticalCancelWithinHours: 24,

  /** Recategorización automática */
  recategorizationMinClosedOrders: 3,
  recategorizationReviewDays: 90,

  /** Onboarding: automatizar altas al superar umbral mensual */
  monthlyAccessRequestsAutomationThreshold: Number(
    process.env.ACCESS_AUTOMATION_THRESHOLD ?? 50
  ),

  /** Facturación mensual comisiones plataforma */
  commissionInvoiceDueDays: 30,

  /** Calificaciones: recordatorio tras N horas del cierre */
  ratingReminderHours: 24,

  /** Puenteo: mismo par comprador-vendedor */
  bridgePairClosedThreshold: 5,
  bridgePairWindowDays: 60,

  /** Seguridad login */
  maxLoginAttempts: 5,
  loginLockoutMinutes: 30,
  bcryptRounds: 12,
  sessionMaxAgeSeconds: 8 * 60 * 60,
  passwordMinLength: 12,
} as const;

export function isAllowedInvoiceDeadlineDays(days: number): days is InvoiceDeadlineDays {
  return (ALLOWED_INVOICE_DEADLINE_DAYS as readonly number[]).includes(days);
}

export function formatInvoiceDeadlineLabel(days: number): string {
  if (days === 90) return "3 meses";
  if (days === 60) return "2 meses";
  if (days === 30) return "1 mes";
  return `${days} días`;
}

export const ORDER_STATUSES = [
  "borrador",
  "pendiente_vendedor",
  "confirmado",
  "entregado",
  "factura_pendiente",
  "factura_revision",
  "cerrado",
  "disputado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const KYC_STATUSES = ["pendiente", "aprobado", "bloqueado"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const USER_ROLES = ["comprador", "vendedor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
