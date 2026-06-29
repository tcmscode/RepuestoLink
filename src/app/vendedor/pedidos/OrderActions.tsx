"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import {
  BUYER_CATEGORY_LABELS,
  type TradeCategory,
} from "@/lib/config/categories";

export function OrderActions({
  orderId,
  status,
  invoiceApproved,
  buyerRegion,
  paymentCategory,
  identityRevealed,
}: {
  orderId: string;
  status: string;
  invoiceApproved: boolean;
  buyerRegion?: string | null;
  paymentCategory?: string | null;
  identityRevealed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  async function acceptOrder() {
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/accept`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "No se pudo aceptar");
      return;
    }
    toast.success("Pedido aceptado — datos del comprador visibles");
    router.refresh();
  }

  async function rejectOrder() {
    if (!window.confirm("¿Rechazar esta solicitud de compra?")) return;
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rechazado por vendedor" }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo rechazar");
      return;
    }
    toast.success("Pedido rechazado");
    router.refresh();
  }

  async function markDelivered() {
    setLoading(true);
    const res = await fetch(`/api/protected/orders/${orderId}/deliver`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo marcar como entregado");
      return;
    }
    toast.success("Entrega registrada");
    router.refresh();
  }

  async function submitInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get("file") as File | null;

    let filePath: string | undefined;
    if (file && file.size > 0) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const up = await fetch("/api/protected/upload", {
        method: "POST",
        body: uploadData,
      });
      const upJson = await up.json();
      if (up.ok) filePath = upJson.path;
    }

    const res = await fetch(`/api/protected/orders/${orderId}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath,
        numeroFactura: form.get("numeroFactura"),
        cae: form.get("cae"),
        monto: form.get("monto") ? Number(form.get("monto")) : undefined,
        manualEntry: !filePath,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Error al enviar factura");
      return;
    }
    toast.success("Factura enviada — en revisión por el administrador");
    setShowInvoice(false);
    router.refresh();
  }

  const catLabel =
    paymentCategory && paymentCategory in BUYER_CATEGORY_LABELS
      ? BUYER_CATEGORY_LABELS[paymentCategory as TradeCategory]
      : paymentCategory;

  return (
    <div className="mt-4">
      {status === "pendiente_vendedor" && (
        <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
          <p className="font-medium text-orange-900">Solicitud anónima</p>
          <p className="text-orange-800">
            Condición de pago: {catLabel ?? "—"}
            {buyerRegion ? ` · Zona: ${buyerRegion}` : ""}
          </p>
          <p className="mt-1 text-xs text-orange-700">
            Al aceptar, verás la identidad completa del comprador.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {status === "pendiente_vendedor" && (
          <>
            <Button size="sm" onClick={acceptOrder} disabled={loading} data-testid="seller-accept-order">
              Aceptar pedido
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={rejectOrder}
              disabled={loading}
            >
              Rechazar
            </Button>
          </>
        )}
        {status === "confirmado" && identityRevealed && (
          <Button size="sm" onClick={markDelivered} disabled={loading} data-testid="seller-mark-delivered">
            Marcar entregado
          </Button>
        )}
        {status === "factura_pendiente" && !invoiceApproved && (
          <Button size="sm" variant="secondary" onClick={() => setShowInvoice(!showInvoice)} data-testid="seller-upload-invoice">
            Cargar factura
          </Button>
        )}
        {status === "factura_revision" && (
          <p className="text-sm text-purple-800">Factura en revisión por el administrador</p>
        )}
      </div>

      {showInvoice && (
        <form onSubmit={submitInvoice} className="mt-2 w-full space-y-2 rounded border p-3" data-testid="invoice-form">
          <input
            name="numeroFactura"
            placeholder="Nº factura"
            required
            data-testid="invoice-number"
            className="w-full rounded border px-2 py-1 text-sm"
          />
          <input name="cae" placeholder="CAE (opcional)" data-testid="invoice-cae" className="w-full rounded border px-2 py-1 text-sm" />
          <input name="monto" type="number" placeholder="Monto" data-testid="invoice-amount" className="w-full rounded border px-2 py-1 text-sm" />
          <input name="file" type="file" accept="image/*,.pdf" className="text-sm" />
          <Button type="submit" size="sm" disabled={loading} data-testid="invoice-submit">
            Enviar factura
          </Button>
        </form>
      )}
    </div>
  );
}
