import type { PublicListing } from "@/lib/policies/listings";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  listings,
  canBuy,
  emptyMessage,
}: {
  listings: PublicListing[];
  canBuy: boolean;
  emptyMessage?: string;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-slate-700">Sin resultados</p>
        <p className="mt-2 text-sm text-slate-500">
          {emptyMessage ??
            "Probá con otro término: código OEM, marca, modelo de colectivo o camión."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} canBuy={canBuy} />
      ))}
    </div>
  );
}
