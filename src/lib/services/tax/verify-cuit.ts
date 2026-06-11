/**
 * Verificación CUIT + consulta padrón ARCA/AFIP.
 * En producción: conectar WSAA/ARCA. En desarrollo: AFIP_MOCK=true (default).
 */

export type AfipVerificationResult = {
  ok: boolean;
  error?: string;
  activityValid?: boolean;
  data?: {
    cuit: string;
    razonSocial: string;
    estado: string;
    actividades: { codigo: string; descripcion: string }[];
    verifiedAt: string;
    source: "mock" | "arca";
  };
};

export function normalizeCuit(cuit: string): string {
  return cuit.replace(/\D/g, "");
}

export function formatCuit(cuit: string): string {
  const c = normalizeCuit(cuit);
  if (c.length !== 11) return cuit;
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`;
}

export function validateCuitChecksum(cuit: string): boolean {
  const c = normalizeCuit(cuit);
  if (c.length !== 11 || !/^\d+$/.test(c)) return false;
  const digits = c.split("").map(Number);
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * mult[i];
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) check = 9;
  return check === digits[10];
}

const TRANSPORT_ACTIVITY_PREFIXES = ["49", "45", "52"];
const SUPPLIER_ACTIVITY_PREFIXES = ["45", "46", "47"];

function activityMatchesRole(
  actividades: { codigo: string }[],
  role: "comprador" | "vendedor"
): boolean {
  const prefixes =
    role === "comprador" ? TRANSPORT_ACTIVITY_PREFIXES : SUPPLIER_ACTIVITY_PREFIXES;
  return actividades.some((a) =>
    prefixes.some((p) => a.codigo.startsWith(p))
  );
}

export async function verifyCuitWithAfip(
  cuit: string,
  roleRequested: "comprador" | "vendedor",
  declaredRazonSocial?: string
): Promise<AfipVerificationResult> {
  const normalized = normalizeCuit(cuit);
  if (!validateCuitChecksum(normalized)) {
    return { ok: false, error: "CUIT inválido (dígito verificador incorrecto)" };
  }

  const useMock = process.env.AFIP_MOCK !== "false";

  if (useMock) {
    const razonSocial =
      declaredRazonSocial?.trim() ||
      `Empresa verificada CUIT ${formatCuit(normalized)}`;
    const actividades =
      roleRequested === "comprador"
        ? [{ codigo: "492290", descripcion: "Transporte automotor de carga" }]
        : [{ codigo: "453291", descripcion: "Venta al por mayor de repuestos" }];
    const activityValid = activityMatchesRole(actividades, roleRequested);

    return {
      ok: true,
      activityValid,
      data: {
        cuit: normalized,
        razonSocial,
        estado: "ACTIVO",
        actividades,
        verifiedAt: new Date().toISOString(),
        source: "mock",
      },
    };
  }

  if (!process.env.AFIP_CERT_PATH && !process.env.AFIP_TOKEN) {
    return {
      ok: false,
      error:
        "Verificación AFIP en vivo no configurada. Usá AFIP_MOCK=true en desarrollo.",
    };
  }

  return {
    ok: false,
    error: "Integración AFIP en vivo pendiente de certificados WSAA",
  };
}
