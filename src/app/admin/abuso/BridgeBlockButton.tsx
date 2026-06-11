"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BridgeBlockButton({
  buyerCompanyId,
  sellerCompanyId,
}: {
  buyerCompanyId: string;
  sellerCompanyId: string;
}) {
  const router = useRouter();

  async function block() {
    if (
      !window.confirm(
        "¿Bloquear permanentemente a ambas partes por puenteo? Pierden historial y acceso."
      )
    )
      return;
    await fetch("/api/protected/admin/bridge-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerCompanyId, sellerCompanyId }),
    });
    router.refresh();
  }

  return (
    <Button size="sm" variant="danger" onClick={block}>
      Bloquear par
    </Button>
  );
}
