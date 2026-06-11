import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import { MarkPaidButton } from "./MarkPaidButton";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { COMMISSION_PERCENT } from "@/lib/config/business";

export default async function AdminComisionesPage() {
  const commissions = await prisma.commission.findMany({
    include: {
      order: {
        include: { sellerCompany: true, buyerCompany: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Comisiones" nav={[...ADMIN_NAV]}>
      <p className="mb-4 text-sm text-slate-600">
        Comisión fija del {COMMISSION_PERCENT}% por venta cerrada con factura.
      </p>
      <div className="overflow-x-auto rounded-xl border text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Pedido</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Comprador</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.order.orderNumber}</td>
                <td className="p-3">{c.order.sellerCompany.razonSocial}</td>
                <td className="p-3">{c.order.buyerCompany.razonSocial}</td>
                <td className="p-3 font-medium">{formatCurrency(c.amount)}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">
                  {c.status === "pendiente" && (
                    <MarkPaidButton commissionId={c.id} />
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
