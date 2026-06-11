"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function OrderBuyerActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/confirm`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo confirmar");
      return;
    }
    toast.success("Intención enviada al vendedor");
    router.refresh();
  }

  async function cancel() {
    if (
      !window.confirm(
        "¿Cancelar este pedido? Puede afectar tu reputación si ya fue confirmado antes."
      )
    )
      return;
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Cancelado por comprador" }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo cancelar");
      return;
    }
    toast.success("Pedido cancelado");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {status === "borrador" && (
        <>
          <Button onClick={confirm} disabled={loading}>
            Confirmar intención de compra
          </Button>
          <Button variant="ghost" onClick={cancel} disabled={loading}>
            Cancelar borrador
          </Button>
        </>
      )}
      {status === "pendiente_vendedor" && (
        <>
          <p className="w-full text-sm text-orange-800">
            Esperando que el vendedor acepte. El precio quedó registrado; la identidad
            se revela al aceptar.
          </p>
          <Button variant="ghost" onClick={cancel} disabled={loading}>
            Cancelar solicitud
          </Button>
        </>
      )}
      {status === "confirmado" && (
        <Button variant="danger" size="sm" onClick={cancel} disabled={loading}>
          Solicitar cancelación
        </Button>
      )}
    </div>
  );
}
