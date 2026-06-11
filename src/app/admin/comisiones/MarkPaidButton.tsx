"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MarkPaidButton({ commissionId }: { commissionId: string }) {
  const router = useRouter();

  async function markPaid() {
    await fetch(`/api/protected/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pagado" }),
    });
    router.refresh();
  }

  return (
    <Button size="sm" variant="secondary" onClick={markPaid}>
      Marcar pagada
    </Button>
  );
}
