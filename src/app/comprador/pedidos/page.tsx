import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CompradorShell } from "@/components/comprador/CompradorShell";
import { formatCurrency } from "@/lib/utils";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/order-display";

export default async function PedidosPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { buyerCompanyId: session!.user.companyId },
    include: { sellerCompany: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CompradorShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Mis pedidos</h1>
        <Link href="/comprador" className="text-sm text-[#3483fa] hover:underline">
          ← Buscar repuestos
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Todavía no tenés pedidos.</p>
          <Link
            href="/comprador"
            className="mt-3 inline-block text-sm font-medium text-[#3483fa] hover:underline"
          >
            Ir al buscador
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const showSeller = order.status !== "borrador";
            return (
              <Link
                key={order.id}
                href={`/comprador/pedidos/${order.id}`}
                className="block rounded-lg bg-white p-4 shadow-sm transition hover:ring-2 hover:ring-[#3483fa]/30"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                    {showSeller ? (
                      <p className="text-sm font-medium text-[#2d3277]">
                        {order.sellerCompany.razonSocial}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-400">
                        Vendedor oculto hasta confirmar
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-lg font-bold text-slate-900">
                    {formatCurrency(order.subtotal)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </CompradorShell>
  );
}
