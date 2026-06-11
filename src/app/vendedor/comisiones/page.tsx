import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { PanelHeading } from "@/components/vendedor/PanelHeading";
import { formatCurrency } from "@/lib/utils";
import { COMMISSION_PERCENT, BUSINESS_RULES } from "@/lib/config/business";
import { getMonthlyBillsForSeller } from "@/lib/services/monthly-commission";

export default async function ComisionesPage() {
  const session = await auth();
  const [commissions, monthlyBills, company] = await Promise.all([
    prisma.commission.findMany({
      where: { order: { sellerCompanyId: session!.user.companyId } },
      include: { order: true, monthlyBill: true },
      orderBy: { createdAt: "desc" },
    }),
    getMonthlyBillsForSeller(session!.user.companyId),
    prisma.company.findUnique({
      where: { id: session!.user.companyId },
      select: { listingsSuspended: true },
    }),
  ]);

  const totalPending = commissions
    .filter((c) => c.status === "pendiente")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <VendedorShell
      warning={
        company?.listingsSuspended
          ? "Publicaciones suspendidas por comisión mensual impaga. Regularizá el pago con RepuestoLink."
          : undefined
      }
    >
      <PanelHeading
        title="Comisiones"
        subtitle={`${COMMISSION_PERCENT}% sobre ventas cerradas · Pendiente: ${formatCurrency(totalPending)}`}
      />

      <p className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        RepuestoLink emite una factura mensual por el total de comisiones devengadas.
        Plazo de pago: {BUSINESS_RULES.commissionInvoiceDueDays} días. Sin pago, se
        suspenden tus publicaciones.
      </p>

      {monthlyBills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Facturas mensuales plataforma</h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Período</th>
                  <th className="p-3">Operaciones</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Vence</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBills.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="p-3 font-medium">
                      {b.periodMonth}/{b.periodYear}
                    </td>
                    <td className="p-3">{b.orderCount}</td>
                    <td className="p-3 font-semibold">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="p-3">{b.dueAt.toLocaleDateString("es-AR")}</td>
                    <td className="p-3">
                      <span
                        className={
                          b.status === "pagado"
                            ? "text-green-700"
                            : b.status === "vencido"
                              ? "text-red-700"
                              : "text-amber-700"
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <h2 className="mb-3 text-lg font-semibold">Detalle por operación</h2>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 font-medium">Pedido</th>
              <th className="p-3 font-medium">Total venta</th>
              <th className="p-3 font-medium">% comisión</th>
              <th className="p-3 font-medium">Monto comisión</th>
              <th className="p-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Todavía no hay comisiones registradas.
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{c.order.orderNumber}</td>
                  <td className="p-3">{formatCurrency(c.order.subtotal)}</td>
                  <td className="p-3">{c.percent}%</td>
                  <td className="p-3 font-semibold">{formatCurrency(c.amount)}</td>
                  <td className="p-3">
                    <span
                      className={
                        c.status === "pagado"
                          ? "rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                      }
                    >
                      {c.status === "pagado" ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VendedorShell>
  );
}
