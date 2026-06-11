import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { PanelHeading } from "@/components/vendedor/PanelHeading";
import { formatCurrency } from "@/lib/utils";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/order-display";
import { OrderActions } from "./OrderActions";
import { OrderRatingForm } from "@/components/orders/OrderRatingForm";

export default async function VendedorPedidosPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: {
      sellerCompanyId: session!.user.companyId,
      status: { not: "borrador" },
    },
    include: {
      buyerCompany: true,
      items: true,
      invoice: true,
      ratings: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <VendedorShell>
      <PanelHeading
        title="Pedidos"
        subtitle="Aceptá solicitudes, coordiná entrega y facturación"
      />

      {orders.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-600 shadow-sm">
          No hay pedidos aún. Las solicitudes aparecen acá cuando un comprador confirma intención.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const identityRevealed = ![
              "pendiente_vendedor",
              "borrador",
            ].includes(order.status);
            const myRating = order.ratings.find(
              (r) => r.fromCompanyId === session!.user.companyId
            );

            return (
              <div key={order.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                    {identityRevealed ? (
                      <p className="text-sm text-slate-600">
                        Comprador: {order.buyerCompany.razonSocial}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">
                        Comprador anónimo hasta aceptar
                      </p>
                    )}
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                    {order.invoiceDeadlineAt && order.status === "factura_pendiente" && (
                      <p className="mt-1 text-sm text-amber-800">
                        Factura antes del{" "}
                        {order.invoiceDeadlineAt.toLocaleDateString("es-AR")}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(order.subtotal)}
                  </p>
                </div>
                <ul className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex justify-between py-2">
                      <span>
                        {i.quantity}x {i.titleSnapshot}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(i.priceSnapshot * i.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <OrderActions
                  orderId={order.id}
                  status={order.status}
                  invoiceApproved={order.invoice?.adminApproved === true}
                  buyerRegion={order.buyerCompany.provincia}
                  paymentCategory={order.paymentCategory}
                  identityRevealed={identityRevealed}
                />
                {order.status === "cerrado" && !myRating && (
                  <OrderRatingForm
                    orderId={order.id}
                    targetLabel="comprador"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </VendedorShell>
  );
}
