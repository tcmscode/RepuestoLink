import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default async function AdminDashboard() {
  const [pendingKyc, pendingRequests, pendingInvoices, orders, commissions, abuseCount] =
    await Promise.all([
    prisma.company.count({ where: { kycStatus: "pendiente" } }),
    prisma.accessRequest.count({ where: { status: "pendiente" } }),
    prisma.order.count({ where: { status: "factura_revision" } }),
    prisma.order.count(),
    prisma.commission.aggregate({
      _sum: { amount: true },
      where: { status: "pendiente" },
    }),
    prisma.abuseEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return (
    <DashboardShell title="Panel administración" nav={[...ADMIN_NAV]}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Solicitudes de alta">
          <p className="text-3xl font-bold text-amber-600">{pendingRequests}</p>
          <Link href="/admin/solicitudes" className="text-sm text-blue-800 hover:underline">
            Ver solicitudes →
          </Link>
        </Card>
        <Card title="Facturas en revisión">
          <p className="text-3xl font-bold text-purple-600">{pendingInvoices}</p>
          <Link href="/admin/facturas" className="text-sm text-blue-800 hover:underline">
            Revisar facturas →
          </Link>
        </Card>
        <Card title="Alta manual">
          <p className="mb-2 text-sm text-slate-600">
            Crear vendedores y compradores (red cerrada).
          </p>
          <Link href="/admin/altas" className="text-sm font-medium text-blue-800 hover:underline">
            Dar de alta →
          </Link>
        </Card>
        <Card title="Empresas pendientes">
          <p className="text-3xl font-bold text-amber-600">{pendingKyc}</p>
          <Link href="/admin/empresas" className="text-sm text-blue-800 hover:underline">
            Ver empresas →
          </Link>
        </Card>
        <Card title="Pedidos totales">
          <p className="text-3xl font-bold">{orders}</p>
        </Card>
        <Card title="Comisiones pendientes">
          <p className="text-3xl font-bold">
            {formatCurrency(commissions._sum.amount ?? 0)}
          </p>
        </Card>
        <Card title="Eventos abuso (30d)">
          <p className="text-3xl font-bold">{abuseCount}</p>
          <Link href="/admin/abuso" className="text-sm text-blue-800 hover:underline">
            Ver log →
          </Link>
        </Card>
      </div>
    </DashboardShell>
  );
}
