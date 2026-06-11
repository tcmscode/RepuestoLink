"use client";

import Link from "next/link";
import { OrderRatingForm } from "@/components/orders/OrderRatingForm";

type PendingOrder = {
  id: string;
  orderNumber: string;
  sellerCompany?: { razonSocial: string };
  buyerCompany?: { razonSocial: string };
};

export function PendingRatingsBanner({
  asBuyer,
  asSeller,
  role,
}: {
  asBuyer: PendingOrder[];
  asSeller: PendingOrder[];
  role: "comprador" | "vendedor";
}) {
  const pending = role === "comprador" ? asBuyer : asSeller;
  if (pending.length === 0) return null;

  const first = pending[0];
  const targetLabel =
    role === "comprador"
      ? first.sellerCompany?.razonSocial ?? "vendedor"
      : first.buyerCompany?.razonSocial ?? "comprador";

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">
        Tenés {pending.length} calificación{pending.length === 1 ? "" : "es"} pendiente
        {pending.length === 1 ? "" : "s"}
      </p>
      <p className="mt-1 text-sm text-amber-800">
        Pedido {first.orderNumber} — tu opinión ayuda a mantener la red confiable.
      </p>
      <OrderRatingForm
        orderId={first.id}
        targetLabel={role === "comprador" ? "vendedor" : "comprador"}
      />
      {pending.length > 1 && (
        <Link
          href={role === "comprador" ? "/comprador/pedidos" : "/vendedor/pedidos"}
          className="mt-2 inline-block text-sm text-[#3483fa] hover:underline"
        >
          Ver todos los pedidos pendientes de calificar
        </Link>
      )}
    </div>
  );
}
