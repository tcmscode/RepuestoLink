import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CompradorShell } from "@/components/comprador/CompradorShell";
import { formatCurrency } from "@/lib/utils";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/order-display";
import { OrderBuyerActions } from "./OrderBuyerActions";
import { OrderRatingForm } from "@/components/orders/OrderRatingForm";
import { notFound } from "next/navigation";

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const order = await prisma.order.findFirst({
    where: { id, buyerCompanyId: session!.user.companyId },
    include: {
      sellerCompany: true,
      items: true,
      ratings: true,
    },
  });
  if (!order) notFound();

  const revealSeller = !["borrador", "pendiente_vendedor"].includes(order.status);
  const myRating = order.ratings.find(
    (r) => r.fromCompanyId === session!.user.companyId
  );

  return (
    <CompradorShell>
      <Link
        href="/comprador/pedidos"
        className="mb-4 inline-block text-sm text-[#3483fa] hover:underline"
      >
        ← Mis pedidos
      </Link>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
        <span
          className={`mt-2 inline-block rounded px-2 py-1 text-sm font-medium ${orderStatusBadgeClass(order.status)}`}
        >
          {orderStatusLabel(order.status)}
        </span>

        {revealSeller ? (
          <div className="mt-4 rounded-lg border border-[#3483fa]/20 bg-blue-50 p-4">
            <p className="font-semibold text-[#2d3277]">Vendedor</p>
            <p>{order.sellerCompany.razonSocial}</p>
            <p className="text-sm text-slate-600">CUIT: {order.sellerCompany.cuit}</p>
            {order.sellerCompany.telefono && (
              <p className="text-sm">Tel: {order.sellerCompany.telefono}</p>
            )}
            {order.sellerCompany.avgRating != null && (
              <p className="text-sm text-amber-700">
                ★ {order.sellerCompany.avgRating.toFixed(1)} (
                {order.sellerCompany.ratingCount} calificaciones)
              </p>
            )}
            <p className="mt-2 text-sm text-slate-600">
              Coordiná pago y entrega directamente (cheque / plazo acordado).
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm italic text-slate-500">
            {order.status === "pendiente_vendedor"
              ? "El vendedor está evaluando tu solicitud. Te avisamos cuando acepte."
              : "El vendedor se muestra al confirmar el pedido."}
          </p>
        )}

        <ul className="mt-4 divide-y divide-slate-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm">
              <span>
                {i.quantity}x {i.titleSnapshot}
              </span>
              <span className="font-medium">
                {formatCurrency(i.priceSnapshot * i.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-2xl font-bold">{formatCurrency(order.subtotal)}</p>
        <OrderBuyerActions orderId={order.id} status={order.status} />
        {order.status === "cerrado" && !myRating && (
          <OrderRatingForm orderId={order.id} targetLabel="vendedor" />
        )}
      </div>
    </CompradorShell>
  );
}
