import { describe, expect, it } from "vitest";
import {
  formatCuit,
  normalizeCuit,
  validateCuitChecksum,
} from "@/lib/services/tax/verify-cuit";

describe("validateCuitChecksum", () => {
  it("acepta CUIT demo válido", () => {
    expect(validateCuitChecksum("30711111111")).toBe(true);
  });

  it("rechaza dígito incorrecto", () => {
    expect(validateCuitChecksum("30711111112")).toBe(false);
  });
});

describe("normalizeCuit", () => {
  it("elimina guiones", () => {
    expect(normalizeCuit("30-71111111-1")).toBe("30711111111");
  });
});

describe("formatCuit", () => {
  it("formatea con guiones", () => {
    expect(formatCuit("30711111111")).toBe("30-71111111-1");
  });
});
