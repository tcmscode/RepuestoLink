import { ReactNode, Suspense } from "react";
import { VendedorHeader } from "./VendedorHeader";
import { PendingRatingsNotice } from "@/components/orders/PendingRatingsNotice";

export function VendedorShell({
  children,
  warning,
}: {
  children: ReactNode;
  warning?: string;
}) {
  return (
    <div className="min-h-screen bg-[#ededed] pb-12">
      <VendedorHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <PendingRatingsNotice role="vendedor" />
        {warning && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {warning}
          </div>
        )}
        <Suspense fallback={<div className="text-sm text-slate-500">Cargando...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
