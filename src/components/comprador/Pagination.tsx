"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `/comprador?${params.toString()}`;
  }

  return (
    <nav className="mt-8 flex justify-center gap-2" aria-label="Paginación">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          ← Anterior
        </Link>
      )}
      <span className="flex items-center px-3 text-sm text-slate-600">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Siguiente →
        </Link>
      )}
    </nav>
  );
}
