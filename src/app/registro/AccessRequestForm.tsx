"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  BUYER_CATEGORY_LABELS,
  SELLER_CATEGORY_LABELS,
  TRADE_CATEGORIES,
  type TradeCategory,
} from "@/lib/config/categories";
import { toast } from "@/lib/toast";

export function AccessRequestForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [role, setRole] = useState<"comprador" | "vendedor">("comprador");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuit: form.get("cuit"),
        razonSocial: form.get("razonSocial"),
        nombreFantasia: form.get("nombreFantasia") || undefined,
        email: form.get("email"),
        telefono: form.get("telefono") || undefined,
        roleRequested: form.get("roleRequested"),
        tradeCategory: form.get("tradeCategory"),
        mensaje: form.get("mensaje") || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setSent(true);
    toast.success(data.message ?? "Solicitud enviada");
    e.currentTarget.reset();
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold">Solicitud recibida</p>
        <p className="mt-1">
          Verificamos tu CUIT en ARCA. Si la automatización está activa, recibirás acceso
          en minutos; si no, un administrador te contactará en 48 horas.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 text-sm text-[#3483fa] hover:underline"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t pt-6">
      <h3 className="font-semibold text-slate-900">Solicitar alta</h3>
      <p className="text-xs text-slate-500">
        Validamos CUIT y actividad en ARCA antes de registrar la solicitud.
      </p>
      <input
        name="cuit"
        placeholder="CUIT (11 dígitos)"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        name="razonSocial"
        placeholder="Razón social *"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        name="nombreFantasia"
        placeholder="Nombre de fantasía"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        placeholder="Email de contacto *"
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        name="telefono"
        placeholder="Teléfono"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <select
        name="roleRequested"
        required
        value={role}
        onChange={(e) => setRole(e.target.value as "comprador" | "vendedor")}
        className="w-full rounded border px-3 py-2 text-sm"
      >
        <option value="">Tipo de cuenta *</option>
        <option value="comprador">Comprador (transporte / taller)</option>
        <option value="vendedor">Vendedor / distribuidor</option>
      </select>
      <select name="tradeCategory" required className="w-full rounded border px-3 py-2 text-sm">
        {TRADE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            Cat. {c} —{" "}
            {role === "comprador"
              ? BUYER_CATEGORY_LABELS[c as TradeCategory]
              : SELLER_CATEGORY_LABELS[c as TradeCategory]}
          </option>
        ))}
      </select>
      <textarea
        name="mensaje"
        placeholder="Mensaje opcional"
        rows={3}
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verificando CUIT..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
