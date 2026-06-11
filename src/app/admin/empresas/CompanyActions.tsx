"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  BUYER_CATEGORY_LABELS,
  SELLER_CATEGORY_LABELS,
  TRADE_CATEGORIES,
} from "@/lib/config/categories";

export function CompanyActions({
  companyId,
  kycStatus,
  tradeCategory,
  role,
  manualReviewRequired,
}: {
  companyId: string;
  kycStatus: string;
  tradeCategory: string;
  role: string;
  manualReviewRequired: boolean;
}) {
  const router = useRouter();

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/protected/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {manualReviewRequired && (
        <p className="text-xs font-medium text-amber-800">Revisión manual requerida</p>
      )}
      <div className="flex flex-wrap gap-1">
        {kycStatus !== "aprobado" && (
          <Button size="sm" onClick={() => patch({ kycStatus: "aprobado" })}>
            Aprobar
          </Button>
        )}
        {kycStatus !== "bloqueado" && (
          <Button size="sm" variant="danger" onClick={() => patch({ kycStatus: "bloqueado" })}>
            Bloquear
          </Button>
        )}
        {manualReviewRequired && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => patch({ clearManualReview: true })}
          >
            Quitar revisión
          </Button>
        )}
      </div>
      <select
        defaultValue={tradeCategory}
        onChange={(e) => patch({ tradeCategory: e.target.value })}
        className="rounded border px-2 py-1 text-xs"
      >
        {TRADE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            Cat. {c} —{" "}
            {role === "comprador"
              ? BUYER_CATEGORY_LABELS[c]
              : SELLER_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </div>
  );
}
