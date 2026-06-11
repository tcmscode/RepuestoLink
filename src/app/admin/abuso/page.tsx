import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { getFlaggedTradingPairs } from "@/lib/services/bridge-detection";
import { BridgeBlockButton } from "./BridgeBlockButton";

export default async function AdminAbusoPage() {
  const [events, pairs, reviewQueue] = await Promise.all([
    prisma.abuseEvent.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getFlaggedTradingPairs(),
    prisma.company.findMany({
      where: { manualReviewRequired: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <DashboardShell title="Anti-abuso y fraude" nav={[...ADMIN_NAV]}>
      {reviewQueue.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-amber-900">
            Revisión manual ({reviewQueue.length})
          </h2>
          <ul className="space-y-2 rounded-xl border bg-amber-50/50 p-4 text-sm">
            {reviewQueue.map((c) => (
              <li key={c.id}>
                <strong>{c.razonSocial}</strong> · {c.role} · Cat. {c.tradeCategory}
                {c.kycNotes && (
                  <span className="ml-2 text-slate-600">— {c.kycNotes}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pairs.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-red-900">
            Pares sospechosos de puenteo ({pairs.length})
          </h2>
          <div className="space-y-2">
            {pairs.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/40 p-4 text-sm"
              >
                <div>
                  <p>
                    {p.buyerCompany.razonSocial} ↔ {p.sellerCompany.razonSocial}
                  </p>
                  <p className="text-slate-600">
                    {p.closedCount} operaciones cerradas
                  </p>
                </div>
                <BridgeBlockButton
                  buyerCompanyId={p.buyerCompanyId}
                  sellerCompanyId={p.sellerCompanyId}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-2 font-semibold">Log de eventos</h2>
      <div className="overflow-x-auto rounded-xl border text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Empresa</th>
              <th className="p-3">Señal</th>
              <th className="p-3">Peso</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.createdAt.toLocaleString("es-AR")}</td>
                <td className="p-3">{e.company.razonSocial}</td>
                <td className="p-3">{e.signal}</td>
                <td className="p-3">{e.weight}</td>
                <td className="p-3 font-medium">{e.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
