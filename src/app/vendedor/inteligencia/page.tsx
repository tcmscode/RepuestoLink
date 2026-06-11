import { auth } from "@/lib/auth";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { PanelHeading } from "@/components/vendedor/PanelHeading";
import { getSellerMarketInsights } from "@/lib/services/market-intelligence";
import { formatCurrency } from "@/lib/utils";

export default async function InteligenciaPage() {
  const session = await auth();
  const insights = await getSellerMarketInsights(session!.user.companyId);

  return (
    <VendedorShell>
      <PanelHeading
        title="Inteligencia comercial"
        subtitle="Demanda anonimizada del mercado — datos agregados sin identidad de compradores"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resumen</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>SKUs activos: {insights.activeSkus}</li>
            <li>Ventas cerradas analizadas: {insights.closedDealsCount}</li>
            {insights.priceRanges && (
              <li>
                Rango de cierre: {formatCurrency(insights.priceRanges.min)} —{" "}
                {formatCurrency(insights.priceRanges.max)} (prom.{" "}
                {formatCurrency(insights.priceRanges.avg)})
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Demanda por provincia</h2>
          {insights.demandByProvince.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Sin datos aún.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {insights.demandByProvince.map((d) => (
                <li key={d.provincia} className="flex justify-between">
                  <span>{d.provincia}</span>
                  <span className="font-medium">{d.pedidos} pedidos</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="font-semibold text-slate-900">
            Búsquedas relacionadas con tu catálogo
          </h2>
          {insights.topSearches.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              A medida que crezca el tráfico verás términos de búsqueda frecuentes.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {insights.topSearches.map((s) => (
                <li
                  key={s.query}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {s.query}{" "}
                  <span className="text-slate-400">({s.count})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </VendedorShell>
  );
}
