"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BUSINESS_RULES } from "@/lib/config/business";
import {
  BUYER_CATEGORY_LABELS,
  SELLER_CATEGORY_LABELS,
  TRADE_CATEGORIES,
} from "@/lib/config/categories";

export function CreateUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"comprador" | "vendedor">("comprador");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/protected/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear usuario");
      return;
    }

    setSuccess("Usuario creado y aprobado. Ya puede ingresar con su email y contraseña.");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl border bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Tipo</label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as "comprador" | "vendedor")}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="comprador">Comprador</option>
          <option value="vendedor">Vendedor</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Categoría {role === "comprador" ? "de pago" : "de entrega"} (A-D)
        </label>
        <select name="tradeCategory" required className="w-full rounded-lg border px-3 py-2">
          {TRADE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} —{" "}
              {role === "comprador"
                ? BUYER_CATEGORY_LABELS[c]
                : SELLER_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">CUIT</label>
        <input name="cuit" required className="w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Razón social</label>
        <input name="razonSocial" required className="w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre fantasía</label>
        <input name="nombreFantasia" className="w-full rounded-lg border px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input name="provincia" placeholder="Provincia" className="rounded-lg border px-3 py-2" />
        <input name="localidad" placeholder="Localidad" className="rounded-lg border px-3 py-2" />
      </div>
      <input name="telefono" placeholder="Teléfono" className="w-full rounded-lg border px-3 py-2" />
      <hr />
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre del responsable</label>
        <input name="name" required className="w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email (login)</label>
        <input name="email" type="email" required className="w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Contraseña inicial</label>
        <input
          name="password"
          type="password"
          required
          minLength={BUSINESS_RULES.passwordMinLength}
          className="w-full rounded-lg border px-3 py-2"
        />
        <p className="mt-1 text-xs text-slate-500">
          Mínimo {BUSINESS_RULES.passwordMinLength} caracteres, mayúscula, minúscula y número.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creando..." : "Crear y aprobar usuario"}
      </Button>
    </form>
  );
}
