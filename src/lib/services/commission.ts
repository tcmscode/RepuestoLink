import { COMMISSION_PERCENT } from "@/lib/config/business";

export function calculateCommission(subtotal: number) {
  const percent = COMMISSION_PERCENT;
  const amount = Math.round((subtotal * percent) / 100 * 100) / 100;
  return { percent, amount };
}
