import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { PanelHeading } from "@/components/vendedor/PanelHeading";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { COMMISSION_PERCENT } from "@/lib/config/business";

export default async function VendedorDashboard() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const [listingsCount, pendingOrders, commissions, invoiceDue] = await Promise.all([
    prisma.listing.count({ where: { companyId, isActive: true } }),
    prisma.order.count({
      where: {
        sellerCompanyId: companyId,
        status: { in: ["confirmado", "factura_pendiente", "factura_revision"] },
      },
    }),
    prisma.commission.aggregate({
      where: { order: { sellerCompanyId: companyId }, status: "pendiente" },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: { sellerCompanyId: companyId, status: "factura_pendiente" },
    }),
  ]);

  const warning =
    session!.user.kycStatus !== "aprobado"
      ? "Tu cuenta está pendiente de aprobación o bloqueada. No podés operar hasta regularizar."
      : undefined;

  return (
    <VendedorShell warning={warning}>
      <PanelHeading
        title="Panel vendedor"
        subtitle={`Comisión ${COMMISSION_PERCENT}% al cerrar ventas con factura aprobada`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Publicaciones activas">
          <p className="text-3xl font-bold text-slate-900">{listingsCount}</p>
          <Link
            href="/vendedor/stock"
            className="mt-2 inline-block text-sm font-medium text-[#3483fa] hover:underline"
          >
            Gestionar stock →
          </Link>
        </Card>
        <Card title="Pedidos activos">
          <p className="text-3xl font-bold text-slate-900">{pendingOrders}</p>
          {invoiceDue > 0 && (
            <p className="mt-1 text-sm text-amber-800">
              {invoiceDue} con factura pendiente de cargar
            </p>
          )}
          <Link
            href="/vendedor/pedidos"
            className="mt-2 inline-block text-sm font-medium text-[#3483fa] hover:underline"
          >
            Ver pedidos →
          </Link>
        </Card>
        <Card title="Comisiones pendientes">
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(commissions._sum.amount ?? 0)}
          </p>
          <Link
            href="/vendedor/comisiones"
            className="mt-2 inline-block text-sm font-medium text-[#3483fa] hover:underline"
          >
            Ver comisiones →
          </Link>
        </Card>
      </div>

      <p className="mt-6 rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm">
        Solo ves tu stock y precios. Los precios de otros vendedores no son accesibles en
        RepuestoLink.
      </p>
    </VendedorShell>
  );
}
