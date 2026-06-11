import Link from "next/link";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { formatCurrency } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { orderStatusLabel } from "@/lib/order-display";
import { InvoiceReviewActions } from "./InvoiceReviewActions";

export default async function AdminFacturasPage() {
  const orders = await prisma.order.findMany({
    where: { status: "factura_revision" },
    include: {
      buyerCompany: true,
      sellerCompany: true,
      invoice: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DashboardShell title="Revisión de facturas" nav={[...ADMIN_NAV]}>
      {orders.length === 0 ? (
        <p className="text-slate-600">No hay facturas pendientes de revisión.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-sm text-slate-600">
                    Vendedor: {o.sellerCompany.razonSocial} · Comprador:{" "}
                    {o.buyerCompany.razonSocial}
                  </p>
                  <p className="text-sm">
                    {orderStatusLabel(o.status)} · {formatCurrency(o.subtotal)}
                  </p>
                </div>
                <InvoiceReviewActions orderId={o.id} />
              </div>
              {o.invoice && (
                <dl className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Nº factura</dt>
                    <dd>{o.invoice.numeroFactura ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">CAE</dt>
                    <dd>{o.invoice.cae ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Monto</dt>
                    <dd>{o.invoice.monto != null ? formatCurrency(o.invoice.monto) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Enviada</dt>
                    <dd>
                      {o.invoice.submittedAt?.toLocaleString("es-AR") ?? "—"}
                    </dd>
                  </div>
                  {o.invoice.filePath && (
                    <div className="sm:col-span-2">
                      <Link
                        href={o.invoice.filePath}
                        target="_blank"
                        className="text-sm font-medium text-blue-800 hover:underline"
                      >
                        Ver archivo adjunto →
                      </Link>
                    </div>
                  )}
                </dl>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
