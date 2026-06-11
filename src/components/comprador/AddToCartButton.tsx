"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function AddToCartButton({
  listingId,
  maxStock = 99,
}: {
  listingId: string;
  maxStock?: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    const res = await fetch("/api/protected/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, quantity }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo agregar");
      return;
    }
    toast.success(`${quantity} unidad${quantity > 1 ? "es" : ""} agregada${quantity > 1 ? "s" : ""} al carrito`);
  }

  const cap = Math.max(1, Math.min(maxStock, 999));

  return (
    <div className="mt-2 flex gap-2">
      <select
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm"
        aria-label="Cantidad"
      >
        {Array.from({ length: cap }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        className="flex-1 bg-[#3483fa] hover:bg-[#2968c8]"
        onClick={add}
        disabled={loading || maxStock < 1}
      >
        {loading ? "Agregando..." : "Agregar al carrito"}
      </Button>
    </div>
  );
}
