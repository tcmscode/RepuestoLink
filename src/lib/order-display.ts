import type { OrderStatus } from "@/lib/config/business";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  borrador: "Borrador",
  pendiente_vendedor: "Esperando aceptación del vendedor",
  confirmado: "Confirmado — esperando entrega",
  entregado: "Entregado",
  factura_pendiente: "Entregado — subir factura",
  factura_revision: "Factura en revisión",
  cerrado: "Cerrado",
  disputado: "En disputa",
  cancelado: "Cancelado",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "borrador":
      return "bg-slate-100 text-slate-700";
    case "pendiente_vendedor":
      return "bg-orange-100 text-orange-900";
    case "confirmado":
      return "bg-blue-100 text-blue-800";
    case "factura_pendiente":
      return "bg-amber-100 text-amber-900";
    case "factura_revision":
      return "bg-purple-100 text-purple-900";
    case "cerrado":
      return "bg-green-100 text-green-800";
    case "disputado":
      return "bg-red-100 text-red-800";
    case "cancelado":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
