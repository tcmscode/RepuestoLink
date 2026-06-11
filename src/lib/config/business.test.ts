import { describe, expect, it } from "vitest";
import {
  formatInvoiceDeadlineLabel,
  isAllowedInvoiceDeadlineDays,
} from "./business";

describe("isAllowedInvoiceDeadlineDays", () => {
  it("acepta plazos válidos", () => {
    expect(isAllowedInvoiceDeadlineDays(15)).toBe(true);
    expect(isAllowedInvoiceDeadlineDays(90)).toBe(true);
  });

  it("rechaza plazos inválidos", () => {
    expect(isAllowedInvoiceDeadlineDays(45)).toBe(false);
    expect(isAllowedInvoiceDeadlineDays(120)).toBe(false);
  });
});

describe("formatInvoiceDeadlineLabel", () => {
  it("formatea plazos largos", () => {
    expect(formatInvoiceDeadlineLabel(90)).toBe("3 meses");
    expect(formatInvoiceDeadlineLabel(15)).toBe("15 días");
  });
});
