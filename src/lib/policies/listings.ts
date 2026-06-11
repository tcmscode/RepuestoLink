import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/config/business";
import {
  getPriceForCategory,
  invoiceDaysForCategory,
  isTradeCategory,
  priceFieldForCategory,
  type TradeCategory,
} from "@/lib/config/categories";

export type PublicListing = {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  brand: string | null;
  category: string;
  vehicleCompatibility: string | null;
  condition: string;
  oemCodes: string | null;
  replacesOem: string | null;
  invoiceDeadlineDays: number;
  sellerRegion: string | null;
  sellerRating?: number | null;
  sellerRatingCount?: number;
  minPriceSameSku?: number | null;
  sameSkuCount?: number;
  sellerCompanyId?: string;
  sellerName?: string;
  sellerPhone?: string;
};

export type ListingFilters = {
  q?: string;
  brand?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "stock";
  buyerCompanyId?: string;
  provincia?: string;
};

export type ListingSearchResult = {
  listings: PublicListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  brands: string[];
  buyerCategory?: TradeCategory;
};

type ListingRow = {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  price: number;
  priceContado: number | null;
  price30: number | null;
  price60: number | null;
  price90: number | null;
  stock: number;
  brand: string | null;
  category: string;
  vehicleCompatibility: string | null;
  condition: string;
  oemCodes: string | null;
  replacesOem: string | null;
  invoiceDeadlineDays: number;
  company: {
    provincia: string | null;
    avgRating: number | null;
    ratingCount: number;
    tradeCategory: string;
  };
};

async function resolveBuyerCategory(
  buyerCompanyId?: string
): Promise<TradeCategory | null> {
  if (!buyerCompanyId) return null;
  const company = await prisma.company.findUnique({
    where: { id: buyerCompanyId },
    select: { tradeCategory: true, role: true },
  });
  if (!company || company.role !== "comprador") return null;
  return isTradeCategory(company.tradeCategory)
    ? company.tradeCategory
    : "B";
}

function effectivePrice(row: ListingRow, buyerCat: TradeCategory): number | null {
  return getPriceForCategory(row, buyerCat);
}

function buildWhere(filters: ListingFilters, buyerCat: TradeCategory | null) {
  const term = filters.q?.trim();
  const priceField = buyerCat ? priceFieldForCategory(buyerCat) : null;

  return {
    isActive: true,
    stock: { gt: 0 },
    company: {
      kycStatus: "aprobado" as const,
      role: "vendedor" as const,
      listingsSuspended: false,
      ...(buyerCat ? { tradeCategory: buyerCat } : {}),
      ...(filters.provincia ? { provincia: filters.provincia } : {}),
    },
    ...(priceField ? { [priceField]: { not: null, gt: 0 } } : {}),
    ...(term
      ? {
          OR: [
            { sku: { contains: term } },
            { title: { contains: term } },
            { brand: { contains: term } },
            { vehicleCompatibility: { contains: term } },
            { description: { contains: term } },
            { oemCodes: { contains: term } },
            { replacesOem: { contains: term } },
          ],
        }
      : {}),
    ...(filters.brand ? { brand: filters.brand } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.condition ? { condition: filters.condition } : {}),
  };
}

function mapRowToPublic(
  row: ListingRow,
  buyerCat: TradeCategory | null,
  skuStats?: { min: number | null; count: number }
): PublicListing | null {
  const price = buyerCat
    ? effectivePrice(row, buyerCat)
    : row.priceContado ?? row.price30 ?? row.price60 ?? row.price90 ?? row.price;

  if (price == null || price <= 0) return null;

  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    description: row.description,
    price,
    stock: row.stock,
    brand: row.brand,
    category: row.category,
    vehicleCompatibility: row.vehicleCompatibility,
    condition: row.condition,
    oemCodes: row.oemCodes,
    replacesOem: row.replacesOem,
    invoiceDeadlineDays: buyerCat
      ? invoiceDaysForCategory(buyerCat)
      : row.invoiceDeadlineDays,
    sellerRegion: row.company.provincia,
    sellerRating: row.company.avgRating,
    sellerRatingCount: row.company.ratingCount,
    minPriceSameSku:
      skuStats && skuStats.count > 1 ? skuStats.min : null,
    sameSkuCount: skuStats?.count ?? 1,
  };
}

async function attachSkuPricing(
  listings: ListingRow[],
  buyerCat: TradeCategory | null
): Promise<PublicListing[]> {
  const uniqueSkus = [...new Set(listings.map((l) => l.sku))];
  const skuStats = await Promise.all(
    uniqueSkus.map(async (sku) => {
      const rows = await prisma.listing.findMany({
        where: {
          isActive: true,
          stock: { gt: 0 },
          company: { kycStatus: "aprobado", role: "vendedor", listingsSuspended: false },
          sku,
        },
        select: {
          priceContado: true,
          price30: true,
          price60: true,
          price90: true,
          price: true,
        },
      });
      const prices = rows
        .map((r) =>
          buyerCat
            ? getPriceForCategory(r, buyerCat)
            : r.priceContado ?? r.price30 ?? r.price60 ?? r.price90 ?? r.price
        )
        .filter((p): p is number => p != null && p > 0);
      return {
        sku,
        min: prices.length ? Math.min(...prices) : null,
        count: prices.length,
      };
    })
  );
  const map = new Map(skuStats.map((s) => [s.sku.toLowerCase(), s]));

  return listings
    .map((l) => {
      const stats = map.get(l.sku.toLowerCase());
      return mapRowToPublic(l, buyerCat, stats);
    })
    .filter((l): l is PublicListing => l != null);
}

const listingSelect = {
  id: true,
  sku: true,
  title: true,
  description: true,
  price: true,
  priceContado: true,
  price30: true,
  price60: true,
  price90: true,
  stock: true,
  brand: true,
  category: true,
  vehicleCompatibility: true,
  condition: true,
  oemCodes: true,
  replacesOem: true,
  invoiceDeadlineDays: true,
  company: {
    select: {
      provincia: true,
      localidad: true,
      razonSocial: true,
      telefono: true,
      avgRating: true,
      ratingCount: true,
      tradeCategory: true,
    },
  },
} as const;

export async function searchListingsForBuyer(
  filters: ListingFilters = {}
): Promise<ListingSearchResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(12, filters.pageSize ?? 12));
  const buyerCat = await resolveBuyerCategory(filters.buyerCompanyId);
  const where = buildWhere(filters, buyerCat);
  const priceField = buyerCat ? priceFieldForCategory(buyerCat) : "price";

  const orderBy =
    filters.sort === "price_asc"
      ? { [priceField]: "asc" as const }
      : filters.sort === "price_desc"
        ? { [priceField]: "desc" as const }
        : filters.sort === "stock"
          ? { stock: "desc" as const }
          : filters.q
            ? { updatedAt: "desc" as const }
            : [{ stock: "desc" as const }, { updatedAt: "desc" as const }];

  const [total, rows, brandRows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: listingSelect,
    }),
    prisma.listing.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        company: { kycStatus: "aprobado", role: "vendedor", listingsSuspended: false },
        brand: { not: null },
      },
      select: { brand: true },
      distinct: ["brand"],
      take: 50,
    }),
  ]);

  const listings = await attachSkuPricing(rows as ListingRow[], buyerCat);
  const brands = brandRows
    .map((b) => b.brand)
    .filter((b): b is string => !!b)
    .sort();

  return {
    listings,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    brands,
    buyerCategory: buyerCat ?? undefined,
  };
}

export async function getListingsForBuyer(
  search?: string,
  options?: { featuredLimit?: number; buyerCompanyId?: string }
): Promise<PublicListing[]> {
  const result = await searchListingsForBuyer({
    q: search,
    pageSize: options?.featuredLimit ?? 24,
    page: 1,
    buyerCompanyId: options?.buyerCompanyId,
  });
  return result.listings;
}

export async function getListingDetailForBuyer(
  listingId: string,
  buyerCompanyId?: string
) {
  const buyerCat = await resolveBuyerCategory(buyerCompanyId);
  const where = {
    id: listingId,
    isActive: true,
    company: {
      kycStatus: "aprobado" as const,
      role: "vendedor" as const,
      ...(buyerCat ? { tradeCategory: buyerCat } : {}),
    },
    ...(buyerCat
      ? { [priceFieldForCategory(buyerCat)]: { not: null, gt: 0 } }
      : {}),
  };

  const listing = await prisma.listing.findFirst({
    where,
    select: listingSelect,
  });
  if (!listing) return null;

  const [enriched] = await attachSkuPricing([listing as ListingRow], buyerCat);
  if (!enriched) return null;

  const sameSku = await prisma.listing.findMany({
    where: {
      id: { not: listingId },
      sku: listing.sku,
      isActive: true,
      stock: { gt: 0 },
      company: {
        kycStatus: "aprobado",
        role: "vendedor",
        ...(buyerCat ? { tradeCategory: buyerCat } : {}),
      },
      ...(buyerCat
        ? { [priceFieldForCategory(buyerCat)]: { not: null, gt: 0 } }
        : {}),
    },
    select: listingSelect,
    take: 20,
  });

  const alternatives = await attachSkuPricing(sameSku as ListingRow[], buyerCat);

  return { listing: enriched, alternatives };
}

export async function getSearchSuggestions(term: string, limit = 8) {
  const q = term.trim();
  if (q.length < 2) return [];

  const [skus, brands, titles] = await Promise.all([
    prisma.listing.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        sku: { contains: q },
        company: { kycStatus: "aprobado", role: "vendedor", listingsSuspended: false },
      },
      select: { sku: true },
      distinct: ["sku"],
      take: limit,
    }),
    prisma.listing.findMany({
      where: {
        isActive: true,
        brand: { contains: q },
        company: { kycStatus: "aprobado", role: "vendedor", listingsSuspended: false },
      },
      select: { brand: true },
      distinct: ["brand"],
      take: limit,
    }),
    prisma.listing.findMany({
      where: {
        isActive: true,
        title: { contains: q },
        company: { kycStatus: "aprobado", role: "vendedor", listingsSuspended: false },
      },
      select: { title: true },
      take: limit,
    }),
  ]);

  const items = new Set<string>();
  skus.forEach((s) => items.add(s.sku));
  brands.forEach((b) => b.brand && items.add(b.brand));
  titles.forEach((t) => items.add(t.title));
  return [...items].slice(0, limit);
}

export async function recordSearch(userId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  await prisma.searchHistory.create({ data: { userId, query: q } });
  const old = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.searchHistory.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}

export async function getRecentSearches(userId: string, limit = 8) {
  const rows = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit * 2,
  });
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      const k = r.query.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit)
    .map((r) => r.query);
}

export async function recordRecentlyViewed(userId: string, listingId: string) {
  await prisma.recentlyViewed.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: { viewedAt: new Date() },
  });
  const excess = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    skip: 12,
    select: { id: true },
  });
  if (excess.length) {
    await prisma.recentlyViewed.deleteMany({
      where: { id: { in: excess.map((e) => e.id) } },
    });
  }
}

export async function getRecentlyViewedListings(
  userId: string,
  limit = 8,
  buyerCompanyId?: string
) {
  const rows = await prisma.recentlyViewed.findMany({
    where: { userId, listing: { isActive: true, stock: { gt: 0 } } },
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: {
      listing: { select: listingSelect },
    },
  });
  const buyerCat = await resolveBuyerCategory(buyerCompanyId);
  return attachSkuPricing(
    rows.map((r) => r.listing as ListingRow),
    buyerCat
  );
}

export async function getListingsForSeller(companyId: string) {
  return prisma.listing.findMany({
    where: { companyId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getListingByIdForRole(
  listingId: string,
  role: UserRole,
  companyId: string,
  orderConfirmed = false,
  buyerCompanyId?: string
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { company: true },
  });
  if (!listing || !listing.isActive) return null;

  if (role === "vendedor") {
    if (listing.companyId !== companyId) return null;
    return listing;
  }

  if (role === "comprador" || role === "admin") {
    const buyerCat = await resolveBuyerCategory(buyerCompanyId);
    const price = buyerCat
      ? getPriceForCategory(listing, buyerCat)
      : listing.price;

    if (role === "comprador" && (price == null || price <= 0)) return null;
    if (
      role === "comprador" &&
      buyerCat &&
      listing.company.tradeCategory !== buyerCat
    ) {
      return null;
    }

    const base = {
      id: listing.id,
      sku: listing.sku,
      title: listing.title,
      description: listing.description,
      price: price ?? listing.price,
      stock: listing.stock,
      brand: listing.brand,
      category: listing.category,
      vehicleCompatibility: listing.vehicleCompatibility,
      condition: listing.condition,
      oemCodes: listing.oemCodes,
      replacesOem: listing.replacesOem,
      invoiceDeadlineDays: buyerCat
        ? invoiceDaysForCategory(buyerCat)
        : listing.invoiceDeadlineDays,
      sellerRating: listing.company.avgRating,
      sellerRatingCount: listing.company.ratingCount,
    };
    if (orderConfirmed || role === "admin") {
      return {
        ...base,
        sellerCompanyId: listing.companyId,
        sellerName: listing.company.razonSocial,
        sellerPhone: listing.company.telefono,
      };
    }
    return base;
  }

  return null;
}

export { resolveBuyerCategory };
