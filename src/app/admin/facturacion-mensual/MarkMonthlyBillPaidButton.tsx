"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MarkMonthlyBillPaidButton({ billId }: { billId: string }) {
  const router = useRouter();

  async function markPaid() {
    await fetch(`/api/protected/admin/monthly-bills/${billId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid" }),
    });
    router.refresh();
  }

  return (
    <Button size="sm" onClick={markPaid}>
      Marcar pagada
    </Button>
  );
}
