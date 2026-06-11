import { ReactNode, Suspense } from "react";
import { CompradorHeader } from "./CompradorHeader";
import { CompareBar } from "./CompareBar";
import { PendingRatingsNotice } from "@/components/orders/PendingRatingsNotice";

export function CompradorShell({
  children,
  searchQuery,
  warning,
}: {
  children: ReactNode;
  searchQuery?: string;
  warning?: string;
}) {
  return (
    <div className="min-h-screen bg-[#ededed] pb-16">
      <CompradorHeader searchQuery={searchQuery} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <PendingRatingsNotice role="comprador" />
        {warning && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {warning}
          </div>
        )}
        <Suspense fallback={<div className="text-sm text-slate-500">Cargando...</div>}>
          {children}
        </Suspense>
      </div>
      <CompareBar />
    </div>
  );
}
