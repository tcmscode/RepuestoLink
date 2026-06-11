import { describe, expect, it } from "vitest";
import {
  categoriesMatch,
  getPriceForCategory,
  invoiceDaysForCategory,
  syncListingPrimaryPrice,
} from "./categories";

describe("categoriesMatch", () => {
  it("solo empareja misma letra A-D", () => {
    expect(categoriesMatch("A", "A")).toBe(true);
    expect(categoriesMatch("B", "C")).toBe(false);
  });
});

describe("getPriceForCategory", () => {
  it("devuelve precio por categoría", () => {
    expect(
      getPriceForCategory(
        { priceContado: 100, price30: 110, price60: null, price90: null },
        "B"
      )
    ).toBe(110);
  });
});

describe("syncListingPrimaryPrice", () => {
  it("usa el mínimo de listas cargadas", () => {
    expect(
      syncListingPrimaryPrice({
        priceContado: 200,
        price30: 180,
        price60: null,
        price90: null,
      })
    ).toBe(180);
  });
});

describe("invoiceDaysForCategory", () => {
  it("mapea plazos del plan", () => {
    expect(invoiceDaysForCategory("A")).toBe(15);
    expect(invoiceDaysForCategory("D")).toBe(90);
  });
});
