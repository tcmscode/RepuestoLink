"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { COMMISSION_PERCENT } from "@/lib/config/business";
import { LISTING_CATEGORIES } from "@/lib/listing-display";
import { toast } from "@/lib/toast";

export function ListingForm({
  sellerCategory,
}: {
  sellerCategory: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      sku: form.get("sku"),
      title: form.get("title"),
      description: form.get("description"),
      stock: Number(form.get("stock")),
      brand: form.get("brand"),
      category: form.get("category"),
      vehicleCompatibility: form.get("vehicleCompatibility"),
      condition: form.get("condition"),
      oemCodes: form.get("oemCodes"),
      replacesOem: form.get("replacesOem"),
      priceContado: form.get("priceContado")
        ? Number(form.get("priceContado"))
        : undefined,
      price30: form.get("price30") ? Number(form.get("price30")) : undefined,
      price60: form.get("price60") ? Number(form.get("price60")) : undefined,
      price90: form.get("price90") ? Number(form.get("price90")) : undefined,
    };

    const res = await fetch("/api/protected/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error");
      toast.error(data.error ?? "Error al publicar");
      return;
    }
    toast.success("Publicación creada");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Nueva publicación</h3>
      <p className="text-xs text-slate-500">
        Cuatro listas de precio (contado, 30, 60 y 90 días). Comisión fija del{" "}
        {COMMISSION_PERCENT}% al cerrar con factura. Tu categoría de operación es{" "}
        <strong>{sellerCategory}</strong> — ese precio es obligatorio.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="sku"
          placeholder="SKU * (ej. MB-1114-DIF-01)"
          required
          className="rounded border px-3 py-2 font-mono md:col-span-2"
        />
        <input name="title" placeholder="Título *" required className="rounded border px-3 py-2 md:col-span-2" />
        <input
          name="priceContado"
          type="number"
          placeholder="Precio contado (Cat. A)"
          required={sellerCategory === "A"}
          className="rounded border px-3 py-2"
        />
        <input
          name="price30"
          type="number"
          placeholder="Precio 30 días (Cat. B)"
          required={sellerCategory === "B"}
          className="rounded border px-3 py-2"
        />
        <input
          name="price60"
          type="number"
          placeholder="Precio 60 días (Cat. C)"
          required={sellerCategory === "C"}
          className="rounded border px-3 py-2"
        />
        <input
          name="price90"
          type="number"
          placeholder="Precio 90+ días (Cat. D)"
          required={sellerCategory === "D"}
          className="rounded border px-3 py-2"
        />
        <input name="stock" type="number" placeholder="Stock *" required defaultValue={1} className="rounded border px-3 py-2" />
        <input name="brand" placeholder="Marca" className="rounded border px-3 py-2" />
        <select name="category" className="rounded border px-3 py-2">
          {LISTING_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input name="vehicleCompatibility" placeholder="Compatibilidad vehículo" className="rounded border px-3 py-2 md:col-span-2" />
        <input
          name="oemCodes"
          placeholder="Códigos OEM (separados por coma)"
          className="rounded border px-3 py-2 md:col-span-2"
        />
        <input
          name="replacesOem"
          placeholder="Equivalencias / reemplaza a..."
          className="rounded border px-3 py-2 md:col-span-2"
        />
        <select name="condition" className="rounded border px-3 py-2" defaultValue="nuevo">
          <option value="nuevo">Nuevo</option>
          <option value="reacondicionado">Reacondicionado</option>
          <option value="usado">Usado</option>
        </select>
      </div>
      <textarea name="description" placeholder="Descripción técnica" className="w-full rounded border px-3 py-2" rows={3} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="bg-[#3483fa] hover:bg-[#2968c8]">
        Publicar
      </Button>
    </form>
  );
}
