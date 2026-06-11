"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LISTING_CATEGORIES } from "@/lib/listing-display";

function FilterFields({
  brands,
  current,
  update,
}: {
  brands: string[];
  current: {
    brand?: string;
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
  update: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="mb-1 block text-xs text-slate-500">Ordenar</label>
        <select
          value={current.sort ?? ""}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full rounded border px-2 py-1.5"
        >
          <option value="">Relevancia</option>
          <option value="price_asc">Menor precio</option>
          <option value="price_desc">Mayor precio</option>
          <option value="stock">Más stock</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Categoría</label>
        <select
          value={current.category ?? ""}
          onChange={(e) => update("category", e.target.value)}
          className="w-full rounded border px-2 py-1.5"
        >
          <option value="">Todas</option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Marca</label>
        <select
          value={current.brand ?? ""}
          onChange={(e) => update("brand", e.target.value)}
          className="w-full rounded border px-2 py-1.5"
        >
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Condición</label>
        <select
          value={current.condition ?? ""}
          onChange={(e) => update("condition", e.target.value)}
          className="w-full rounded border px-2 py-1.5"
        >
          <option value="">Todas</option>
          <option value="nuevo">Nuevo</option>
          <option value="reacondicionado">Reacondicionado</option>
          <option value="usado">Usado</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Precio min</label>
          <input
            type="number"
            defaultValue={current.minPrice}
            onBlur={(e) => update("minPrice", e.target.value)}
            className="w-full rounded border px-2 py-1.5"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Precio max</label>
          <input
            type="number"
            defaultValue={current.maxPrice}
            onBlur={(e) => update("maxPrice", e.target.value)}
            className="w-full rounded border px-2 py-1.5"
            placeholder="999999"
          />
        </div>
      </div>
    </div>
  );
}

export function ListingFilters({
  brands,
  current,
}: {
  brands: string[];
  current: {
    brand?: string;
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = [
    current.brand,
    current.category,
    current.condition,
    current.minPrice,
    current.maxPrice,
    current.sort,
  ].filter(Boolean).length;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/comprador?${params.toString()}`);
    setMobileOpen(false);
  }

  function clearFilters() {
    router.push("/comprador");
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile: botón + drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm"
        >
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-[#3483fa] px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Cerrar filtros"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative ml-auto flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-semibold text-slate-900">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl leading-none text-slate-500"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterFields brands={brands} current={current} update={update} />
              </div>
              <div className="border-t p-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-lg border py-2 text-sm font-medium text-[#3483fa]"
                >
                  Limpiar filtros
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Desktop: sidebar */}
      <aside className="hidden rounded-lg bg-white p-4 shadow-sm lg:block">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Filtros</h2>
        <FilterFields brands={brands} current={current} update={update} />
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 w-full text-xs text-[#3483fa] hover:underline"
        >
          Limpiar filtros
        </button>
      </aside>
    </>
  );
}
