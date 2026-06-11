import Link from "next/link";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { AccessRequestActions } from "./AccessRequestActions";
import { countAccessRequestsThisMonth } from "@/lib/services/onboarding-automation";
import { BUSINESS_RULES } from "@/lib/config/business";
import {
  BUYER_CATEGORY_LABELS,
  SELLER_CATEGORY_LABELS,
} from "@/lib/config/categories";

export default async function AdminSolicitudesPage() {
  const [requests, monthlyCount] = await Promise.all([
    prisma.accessRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    countAccessRequestsThisMonth(),
  ]);

  const pending = requests.filter((r) => r.status === "pendiente").length;
  const automationActive =
    monthlyCount >= BUSINESS_RULES.monthlyAccessRequestsAutomationThreshold;

  return (
    <DashboardShell title="Solicitudes de alta" nav={[...ADMIN_NAV]}>
      <p className="mb-4 text-sm text-slate-600">
        {pending} solicitud{pending === 1 ? "" : "es"} pendiente{pending === 1 ? "" : "s"} ·{" "}
        {monthlyCount}/{BUSINESS_RULES.monthlyAccessRequestsAutomationThreshold} altas este mes
        {automationActive && (
          <span className="ml-2 font-medium text-green-700">
            — Automatización activa (AFIP + umbral)
          </span>
        )}
      </p>
      <div className="space-y-3">
        {requests.length === 0 && (
          <p className="text-slate-600">No hay solicitudes.</p>
        )}
        {requests.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 ${
              r.status === "pendiente" ? "border-amber-200 bg-amber-50/50" : "bg-white"
            }`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{r.razonSocial}</p>
                <p className="text-sm text-slate-600">
                  CUIT {r.cuit} · {r.roleRequested} · Cat. {r.tradeCategory} ·{" "}
                  {r.roleRequested === "comprador"
                    ? BUYER_CATEGORY_LABELS[
                        r.tradeCategory as keyof typeof BUYER_CATEGORY_LABELS
                      ]
                    : SELLER_CATEGORY_LABELS[
                        r.tradeCategory as keyof typeof SELLER_CATEGORY_LABELS
                      ]}
                </p>
                <p className="text-sm">{r.email}</p>
                {r.afipVerified && (
                  <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    ARCA verificado
                  </span>
                )}
                {r.autoProvisioned && (
                  <span className="ml-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    Alta automática
                  </span>
                )}
                {r.telefono && <p className="text-sm">Tel: {r.telefono}</p>}
                {r.mensaje && (
                  <p className="mt-2 text-sm italic text-slate-600">&quot;{r.mensaje}&quot;</p>
                )}
                {r.adminNotes && (
                  <p className="mt-1 text-xs text-slate-500">Admin: {r.adminNotes}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {r.createdAt.toLocaleString("es-AR")} · Estado: {r.status}
                </p>
              </div>
              <AccessRequestActions id={r.id} currentStatus={r.status} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Creá cuentas manualmente en{" "}
        <Link href="/admin/altas" className="text-[#3483fa] hover:underline">
          Alta manual
        </Link>
      </p>
    </DashboardShell>
  );
}
