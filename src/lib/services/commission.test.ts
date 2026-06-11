import { describe, expect, it } from "vitest";
import { calculateCommission } from "./commission";

describe("calculateCommission", () => {
  it("calcula 2% por defecto sobre subtotal", () => {
    const { percent, amount } = calculateCommission(10000);
    expect(percent).toBe(2);
    expect(amount).toBe(200);
  });

  it("redondea a dos decimales", () => {
    const { amount } = calculateCommission(1234.56);
    expect(amount).toBe(24.69);
  });
});
