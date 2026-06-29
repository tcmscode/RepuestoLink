"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

export function OrderRatingForm({
  orderId,
  targetLabel,
}: {
  orderId: string;
  targetLabel: string;
}) {
  const router = useRouter();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment: comment || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "No se pudo calificar");
      return;
    }
    toast.success("Calificación enviada");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"
      data-testid="rating-form"
    >
      <p className="mb-2 text-sm font-medium text-amber-900">
        ¿Cómo fue la experiencia con el {targetLabel}?
      </p>
      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className={`text-2xl ${n <= stars ? "text-amber-500" : "text-slate-300"}`}
            aria-label={`${n} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional"
        className="mb-2 w-full rounded border px-2 py-1 text-sm"
        rows={2}
        maxLength={500}
      />
      <Button type="submit" size="sm" disabled={loading} data-testid="rating-submit">
        Enviar calificación
      </Button>
    </form>
  );
}
