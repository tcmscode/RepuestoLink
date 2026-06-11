/**
 * Categorías cruzadas RepuestoLink (Pilar 2 del plan de negocio).
 * Comprador A-D ↔ Vendedor A-D; solo ven ofertas con precio en su categoría.
 */

export const TRADE_CATEGORIES = ["A", "B", "C", "D"] as const;
export type TradeCategory = (typeof TRADE_CATEGORIES)[number];

export const BUYER_CATEGORY_LABELS: Record<TradeCategory, string> = {
  A: "Contado / al día",
  B: "30 días",
  C: "60 días",
  D: "90 días o más",
};

export const SELLER_CATEGORY_LABELS: Record<TradeCategory, string> = {
  A: "Entrega al día siguiente",
  B: "Entrega 2-3 días",
  C: "Entrega 4-5 días",
  D: "Entrega +5 días",
};

export const PRICE_FIELDS = {
  A: "priceContado",
  B: "price30",
  C: "price60",
  D: "price90",
} as const satisfies Record<TradeCategory, string>;

export type ListingPriceField =
  (typeof PRICE_FIELDS)[TradeCategory];

export function isTradeCategory(value: string): value is TradeCategory {
  return (TRADE_CATEGORIES as readonly string[]).includes(value);
}

export function categoriesMatch(
  buyer: TradeCategory,
  seller: TradeCategory
): boolean {
  return buyer === seller;
}

export function priceFieldForCategory(
  category: TradeCategory
): ListingPriceField {
  return PRICE_FIELDS[category];
}

export function invoiceDaysForCategory(category: TradeCategory): number {
  switch (category) {
    case "A":
      return 15;
    case "B":
      return 30;
    case "C":
      return 60;
    case "D":
      return 90;
  }
}

type TierPrices = {
  priceContado?: number | null;
  price30?: number | null;
  price60?: number | null;
  price90?: number | null;
};

export function getPriceForCategory(
  listing: TierPrices,
  category: TradeCategory
): number | null {
  const field = priceFieldForCategory(category);
  const value = listing[field as keyof TierPrices];
  if (value == null || value <= 0) return null;
  return value;
}

export function syncListingPrimaryPrice(tiers: TierPrices): number {
  const prices = TRADE_CATEGORIES.map((c) => getPriceForCategory(tiers, c)).filter(
    (p): p is number => p != null
  );
  return prices.length ? Math.min(...prices) : 0;
}

export function validateTierSchema() {
  return {
    priceContado: null as number | null | undefined,
    price30: null as number | null | undefined,
    price60: null as number | null | undefined,
    price90: null as number | null | undefined,
  };
}
