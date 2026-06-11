"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function DeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("¿Desactivar esta publicación?")) return;
    const res = await fetch(`/api/protected/listings/${listingId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo desactivar");
      return;
    }
    toast.success("Publicación desactivada");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
      Desactivar
    </Button>
  );
}
