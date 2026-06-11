"use client";

import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function RemoveFromCartButton({ listingId }: { listingId: string }) {
  const router = useRouter();

  async function remove() {
    await fetch("/api/protected/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    toast.info("Ítem eliminado del carrito");
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} className="ml-2 text-xs text-red-600 hover:underline">
      Quitar
    </button>
  );
}
