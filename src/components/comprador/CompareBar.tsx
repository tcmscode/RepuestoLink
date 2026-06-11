"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCompare, getCompareItems } from "./compare-store";

export function CompareBar() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getCompareItems().length);
    sync();
    window.addEventListener("compare-updated", sync);
    return () => window.removeEventListener("compare-updated", sync);
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#2d3277] px-5 py-2 text-sm text-white shadow-lg">
      <span>{count} en comparación (máx. 3)</span>
      <Link href="/comprador/comparar" className="font-semibold underline">
        Ver comparación
      </Link>
      <button type="button" onClick={clearCompare} className="text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  );
}
