"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function CheckoutButton({ sellerCompanyId }: { sellerCompanyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/protected/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerCompanyId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Error al crear pedido");
      return;
    }
    toast.success("Pedido borrador creado");
    router.push(`/comprador/pedidos/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <Button size="sm" onClick={checkout} disabled={loading}>
        Crear pedido (borrador)
      </Button>
    </div>
  );
}
