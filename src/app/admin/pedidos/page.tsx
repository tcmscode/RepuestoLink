import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { orderStatusLabel } from "@/lib/order-display";

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    include: { buyerCompany: true, sellerCompany: true, invoice: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <DashboardShell title="Pedidos" nav={[...ADMIN_NAV]}>
      <div className="overflow-x-auto rounded-xl border text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Nº</th>
              <th className="p-3">Comprador</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Total</th>
              <th className="p-3">Factura</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.orderNumber}</td>
                <td className="p-3">{o.buyerCompany.razonSocial}</td>
                <td className="p-3">{o.sellerCompany.razonSocial}</td>
                <td className="p-3">{orderStatusLabel(o.status)}</td>
                <td className="p-3">{formatCurrency(o.subtotal)}</td>
                <td className="p-3">
                  {o.status === "factura_revision"
                    ? "En revisión"
                    : o.invoice?.submittedAt && o.status === "cerrado"
                      ? "✓ Aprobada"
                      : o.status === "factura_pendiente"
                        ? "Pendiente"
                        : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
