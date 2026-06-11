import { describe, expect, it } from "vitest";
import { orderStatusBadgeClass, orderStatusLabel } from "./order-display";

describe("orderStatusLabel", () => {
  it("traduce estados conocidos", () => {
    expect(orderStatusLabel("borrador")).toBe("Borrador");
    expect(orderStatusLabel("confirmado")).toBe("Confirmado — esperando entrega");
    expect(orderStatusLabel("factura_pendiente")).toBe("Entregado — subir factura");
    expect(orderStatusLabel("factura_revision")).toBe("Factura en revisión");
    expect(orderStatusLabel("cerrado")).toBe("Cerrado");
  });

  it("devuelve el código si es desconocido", () => {
    expect(orderStatusLabel("custom")).toBe("custom");
  });
});

describe("orderStatusBadgeClass", () => {
  it("asigna clases por estado", () => {
    expect(orderStatusBadgeClass("cerrado")).toContain("green");
    expect(orderStatusBadgeClass("disputado")).toContain("red");
  });
});
