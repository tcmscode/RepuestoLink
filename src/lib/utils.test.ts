import { describe, expect, it } from "vitest";
import { formatCurrency, generateOrderNumber } from "./utils";

describe("formatCurrency", () => {
  it("formatea en pesos argentinos sin decimales", () => {
    const formatted = formatCurrency(185000);
    expect(formatted).toMatch(/185\.?000/);
    expect(formatted).toMatch(/\$/);
  });
});

describe("generateOrderNumber", () => {
  it("genera prefijo AP- único", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).toMatch(/^AP-/);
    expect(b).toMatch(/^AP-/);
    expect(a).not.toBe(b);
  });
});
