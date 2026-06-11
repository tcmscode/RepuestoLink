"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function CartQuantityControl({
  listingId,
  quantity,
  maxStock,
}: {
  listingId: string;
  quantity: number;
  maxStock: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateQty(newQty: number) {
    setLoading(true);
    const res = await fetch("/api/protected/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, quantity: newQty }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo actualizar la cantidad");
      return;
    }
    if (newQty === 0) toast.info("Ítem eliminado del carrito");
    router.refresh();
  }

  const cap = Math.max(1, Math.min(maxStock, 999));

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={loading || quantity <= 1}
        onClick={() => updateQty(quantity - 1)}
        className="h-8 w-8 rounded border text-sm disabled:opacity-40"
        aria-label="Menos"
      >
        −
      </button>
      <select
        value={quantity}
        disabled={loading}
        onChange={(e) => updateQty(Number(e.target.value))}
        className="h-8 rounded border px-1 text-sm"
      >
        {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={loading || quantity >= cap}
        onClick={() => updateQty(Math.min(quantity + 1, cap))}
        className="h-8 w-8 rounded border text-sm disabled:opacity-40"
        aria-label="Más"
      >
        +
      </button>
    </div>
  );
}
