import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getRecentlyViewedListings,
  recordSearch,
  searchListingsForBuyer,
} from "@/lib/policies/listings";
import { CompradorShell } from "@/components/comprador/CompradorShell";
import { ProductGrid } from "@/components/comprador/ProductGrid";
import { ListingFilters } from "@/components/comprador/ListingFilters";
import { Pagination } from "@/components/comprador/Pagination";

export default async function CompradorHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const term = params.q?.trim();

  if (term && session) {
    await recordSearch(session.user.id, term);
  }

  const result = await searchListingsForBuyer({
    q: term,
    brand: params.brand,
    category: params.category,
    condition: params.condition,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort: (params.sort as "price_asc" | "price_desc" | "stock") || undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 12,
    buyerCompanyId: session?.user.companyId,
  });

  const recentlyViewed =
    !term && session
      ? await getRecentlyViewedListings(session.user.id, 4, session.user.companyId)
      : [];

  const canBuy = session!.user.kycStatus === "aprobado";
  const buyerCompany = session
    ? await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { tradeCategory: true },
      })
    : null;
  const categoryHint = buyerCompany?.tradeCategory
    ? `Mostrando precios para tu categoría ${buyerCompany.tradeCategory} (condición de pago).`
    : undefined;
  const warning =
    session!.user.kycStatus !== "aprobado"
      ? "Tu cuenta está pendiente de aprobación. Podés buscar y ver precios, pero no confirmar compras."
      : categoryHint;

  const title = term ? `Resultados para “${term}”` : "Repuestos disponibles";
  const subtitle = `${result.total} publicación${result.total === 1 ? "" : "es"} encontrada${result.total === 1 ? "" : "s"}`;

  return (
    <CompradorShell searchQuery={term} warning={warning}>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-56">
          <ListingFilters
            brands={result.brands}
            current={{
              brand: params.brand,
              category: params.category,
              condition: params.condition,
              minPrice: params.minPrice,
              maxPrice: params.maxPrice,
              sort: params.sort,
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          {!term && recentlyViewed.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Vistos recientemente
              </h2>
              <ProductGrid listings={recentlyViewed} canBuy={canBuy} />
            </section>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h1>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
            <Link
              href="/comprador/comparar"
              className="hidden text-sm font-medium text-[#3483fa] hover:underline sm:inline"
            >
              Comparar selección
            </Link>
          </div>

          <ProductGrid
            listings={result.listings}
            canBuy={canBuy}
            emptyMessage={
              term
                ? `No hay publicaciones para “${term}”. Probá SKU, código OEM o marca.`
                : undefined
            }
          />

          <Pagination page={result.page} totalPages={result.totalPages} />
        </div>
      </div>
    </CompradorShell>
  );
}
