"use client";

import { useEffect, useState } from "react";
import {
  addToCompare,
  getCompareItems,
  type CompareItem,
} from "./compare-store";

export function CompareButton({ item }: { item: CompareItem }) {
  const [inCompare, setInCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () =>
      setInCompare(getCompareItems().some((c) => c.id === item.id));
    sync();
    window.addEventListener("compare-updated", sync);
    return () => window.removeEventListener("compare-updated", sync);
  }, [item.id]);

  function toggle() {
    if (inCompare) return;
    const ok = addToCompare(item);
    if (!ok) {
      setError("Máximo 3 para comparar");
      return;
    }
    setInCompare(true);
    setError(null);
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={inCompare}
        className="mt-1 w-full rounded border border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {inCompare ? "En comparación" : "Comparar"}
      </button>
      {error && <p className="mt-0.5 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
