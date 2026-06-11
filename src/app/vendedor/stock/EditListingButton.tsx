"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { COMMISSION_PERCENT } from "@/lib/config/business";
import { LISTING_CATEGORIES } from "@/lib/listing-display";
import { toast } from "@/lib/toast";
import type { Listing } from "@prisma/client";

export function EditListingButton({
  listing,
  sellerCategory,
}: {
  listing: Listing;
  sellerCategory: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/protected/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: form.get("sku"),
        title: form.get("title"),
        description: form.get("description") || null,
        priceContado: form.get("priceContado")
          ? Number(form.get("priceContado"))
          : null,
        price30: form.get("price30") ? Number(form.get("price30")) : null,
        price60: form.get("price60") ? Number(form.get("price60")) : null,
        price90: form.get("price90") ? Number(form.get("price90")) : null,
        stock: Number(form.get("stock")),
        brand: form.get("brand") || null,
        category: form.get("category"),
        vehicleCompatibility: form.get("vehicleCompatibility") || null,
        condition: form.get("condition"),
        oemCodes: form.get("oemCodes") || null,
        replacesOem: form.get("replacesOem") || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Error al guardar");
      return;
    }
    toast.success("Publicación actualizada");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-blue-800 hover:underline"
      >
        Editar
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 font-semibold">Editar publicación</h3>
            <p className="mb-3 text-xs text-slate-500">
              Comisión fija del {COMMISSION_PERCENT}%. Cat. operación: {sellerCategory}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="sku"
                defaultValue={listing.sku}
                required
                className="rounded border px-3 py-2 font-mono md:col-span-2"
              />
              <input
                name="title"
                defaultValue={listing.title}
                required
                className="rounded border px-3 py-2 md:col-span-2"
              />
              <input
                name="priceContado"
                type="number"
                defaultValue={listing.priceContado ?? ""}
                placeholder="Contado"
                className="rounded border px-3 py-2"
              />
              <input
                name="price30"
                type="number"
                defaultValue={listing.price30 ?? ""}
                placeholder="30 días"
                className="rounded border px-3 py-2"
              />
              <input
                name="price60"
                type="number"
                defaultValue={listing.price60 ?? ""}
                placeholder="60 días"
                className="rounded border px-3 py-2"
              />
              <input
                name="price90"
                type="number"
                defaultValue={listing.price90 ?? ""}
                placeholder="90 días"
                className="rounded border px-3 py-2"
              />
              <input
                name="stock"
                type="number"
                defaultValue={listing.stock}
                required
                className="rounded border px-3 py-2"
              />
              <input
                name="brand"
                defaultValue={listing.brand ?? ""}
                className="rounded border px-3 py-2"
              />
              <select
                name="category"
                defaultValue={listing.category}
                className="rounded border px-3 py-2"
              >
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                name="vehicleCompatibility"
                defaultValue={listing.vehicleCompatibility ?? ""}
                className="rounded border px-3 py-2 md:col-span-2"
              />
              <input
                name="oemCodes"
                defaultValue={listing.oemCodes ?? ""}
                className="rounded border px-3 py-2 md:col-span-2"
              />
              <input
                name="replacesOem"
                defaultValue={listing.replacesOem ?? ""}
                className="rounded border px-3 py-2 md:col-span-2"
              />
              <select
                name="listing"
                defaultValue={listing.condition}
                className="rounded border px-3 py-2"
              >
                <option value="nuevo">Nuevo</option>
                <option value="reacondicionado">Reacondicionado</option>
                <option value="usado">Usado</option>
              </select>
            </div>
            <textarea
              name="description"
              defaultValue={listing.description ?? ""}
              className="mt-3 w-full rounded border px-3 py-2"
              rows={3}
            />
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
