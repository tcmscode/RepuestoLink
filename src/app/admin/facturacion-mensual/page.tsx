import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { formatCurrency } from "@/lib/utils";
import { MarkMonthlyBillPaidButton } from "./MarkMonthlyBillPaidButton";

export default async function AdminFacturacionMensualPage() {
  const bills = await prisma.monthlyCommissionBill.findMany({
    include: { sellerCompany: true },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    take: 100,
  });

  const pendingTotal = bills
    .filter((b) => b.status === "pendiente" || b.status === "vencido")
    .reduce((s, b) => s + b.totalAmount, 0);

  return (
    <DashboardShell title="Facturación mensual comisiones" nav={[...ADMIN_NAV]}>
      <p className="mb-4 text-sm text-slate-600">
        Facturas emit RepuestoLink → vendedor por comisiones del 2%. Pendiente/vencido:{" "}
        <strong>{formatCurrency(pendingTotal)}</strong>
      </p>
      <div className="overflow-x-auto rounded-xl border text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Período</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Ops</th>
              <th className="p-3">Total</th>
              <th className="p-3">Vence</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">
                  {b.periodMonth}/{b.periodYear}
                </td>
                <td className="p-3">{b.sellerCompany.razonSocial}</td>
                <td className="p-3">{b.orderCount}</td>
                <td className="p-3 font-semibold">{formatCurrency(b.totalAmount)}</td>
                <td className="p-3">{b.dueAt.toLocaleDateString("es-AR")}</td>
                <td className="p-3">{b.status}</td>
                <td className="p-3">
                  {b.status !== "pagado" && (
                    <MarkMonthlyBillPaidButton billId={b.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
