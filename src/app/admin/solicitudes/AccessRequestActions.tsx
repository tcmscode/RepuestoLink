"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

const STATUSES = ["pendiente", "contactado", "aprobado", "rechazado"] as const;

export function AccessRequestActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/protected/admin/access-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo actualizar");
      return;
    }
    toast.success("Solicitud actualizada");
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas internas"
        className="w-full rounded border px-2 py-1 text-sm"
      />
      <Button size="sm" onClick={save} disabled={loading}>
        Guardar
      </Button>
    </div>
  );
}
