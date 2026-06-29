"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function InvoiceReviewActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function review(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch(`/api/protected/admin/invoices/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        adminNotes: action === "reject" ? rejectNotes : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Error");
      return;
    }
    toast.success(action === "approve" ? "Factura aprobada" : "Factura rechazada");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => review("approve")} disabled={loading} data-testid="admin-approve-invoice">
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
        >
          Rechazar
        </Button>
      </div>
      {showReject && (
        <div className="space-y-2">
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Motivo del rechazo *"
            className="w-full rounded border px-2 py-1 text-sm"
            rows={2}
          />
          <Button
            size="sm"
            variant="danger"
            disabled={loading || !rejectNotes.trim()}
            onClick={() => review("reject")}
          >
            Confirmar rechazo
          </Button>
        </div>
      )}
    </div>
  );
}
