"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { formatInvoiceDeadlineLabel } from "@/lib/config/business";
import { conditionLabel } from "@/lib/listing-display";
import {
  clearCompare,
  getCompareItems,
  removeFromCompare,
  type CompareItem,
} from "@/components/comprador/compare-store";

export function CompararContent() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getCompareItems());
    sync();
    window.addEventListener("compare-updated", sync);
    return () => window.removeEventListener("compare-updated", sync);
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Comparar repuestos</h1>
      <p className="mt-1 text-sm text-slate-600">Hasta 3 publicaciones · Sin datos del vendedor</p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg bg-white p-8 text-center text-slate-600 shadow-sm">
          No hay ítems seleccionados. Usá &quot;Comparar&quot; en las tarjetas de producto.
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-medium">Atributo</th>
                  {items.map((i) => (
                    <th key={i.id} className="p-3 font-medium">
                      <button
                        type="button"
                        onClick={() => removeFromCompare(i.id)}
                        className="float-right text-xs text-red-600"
                      >
                        Quitar
                      </button>
                      <span className="font-mono text-xs">{i.sku}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Título</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3 font-medium">
                      <Link
                        href={`/comprador/repuesto/${i.id}`}
                        className="text-[#3483fa] hover:underline"
                      >
                        {i.title}
                      </Link>
                    </td>
                  ))}
                </tr>
                <tr className="border-t bg-slate-50">
                  <td className="p-3 font-semibold">Precio</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3 text-lg font-bold">
                      {formatCurrency(i.price)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Stock</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3">
                      {i.stock} u.
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Condición</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3 capitalize">
                      {conditionLabel(i.condition)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Marca</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3">
                      {i.brand ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Plazo factura</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3">
                      {formatInvoiceDeadlineLabel(i.invoiceDeadlineDays)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 text-slate-500">Zona envío</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3">
                      {i.sellerRegion ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => {
              clearCompare();
              setItems([]);
            }}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Vaciar comparación
          </button>
        </>
      )}
    </>
  );
}
