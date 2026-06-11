import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { formatInvoiceDeadlineLabel } from "@/lib/config/business";
import {
  conditionBadgeClass,
  conditionLabel,
  getCategoryById,
  parseOemCodes,
} from "@/lib/listing-display";
import type { PublicListing } from "@/lib/policies/listings";
import { AddToCartButton } from "./AddToCartButton";
import { CompareButton } from "./CompareButton";
import { CategoryIcon } from "./CategoryIcon";

export function ProductCard({
  listing,
  canBuy,
}: {
  listing: PublicListing;
  canBuy: boolean;
}) {
  const category = getCategoryById(listing.category);
  const oems = parseOemCodes(listing.oemCodes);
  const showFromPrice =
    listing.sameSkuCount &&
    listing.sameSkuCount > 1 &&
    listing.minPriceSameSku != null &&
    listing.minPriceSameSku < listing.price;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-[#3483fa]/50 hover:shadow-md">
      <Link href={`/comprador/repuesto/${listing.id}`} className="flex gap-3 p-4">
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg ${category.bgClass}`}
        >
          <CategoryIcon categoryId={listing.category} className="h-8 w-8" />
          <span className={`mt-0.5 text-[10px] font-semibold ${category.textClass}`}>
            {category.label}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
              {listing.sku}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${conditionBadgeClass(listing.condition)}`}
            >
              {conditionLabel(listing.condition)}
            </span>
            {listing.sellerRegion && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                📍 {listing.sellerRegion}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {listing.title}
          </h3>

          {listing.brand && (
            <p className="mt-0.5 text-xs font-medium text-slate-600">{listing.brand}</p>
          )}
          {listing.vehicleCompatibility && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {listing.vehicleCompatibility}
            </p>
          )}
          {oems.length > 0 && (
            <p className="mt-1 line-clamp-1 font-mono text-[10px] text-slate-500">
              OEM: {oems.slice(0, 3).join(" · ")}
            </p>
          )}
        </div>
      </Link>

      <div className="mt-auto border-t border-slate-100 bg-slate-50 px-4 py-3">
        {showFromPrice && (
          <p className="mb-0.5 text-xs font-medium text-green-700">
            Desde {formatCurrency(listing.minPriceSameSku!)} · {listing.sameSkuCount}{" "}
            ofertas con este SKU
          </p>
        )}
        {listing.sellerRating != null && listing.sellerRatingCount! > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            ★ {listing.sellerRating.toFixed(1)} · Proveedor verificado
          </p>
        )}
        <p className="text-xl font-bold text-slate-900">{formatCurrency(listing.price)}</p>
        <p className="text-[11px] text-slate-500">
          Stock: {listing.stock} u. · Factura {formatInvoiceDeadlineLabel(listing.invoiceDeadlineDays)}
        </p>

        {canBuy ? (
          <>
            <AddToCartButton listingId={listing.id} maxStock={listing.stock} />
            <CompareButton
              item={{
                id: listing.id,
                sku: listing.sku,
                title: listing.title,
                price: listing.price,
                stock: listing.stock,
                brand: listing.brand,
                condition: listing.condition,
                invoiceDeadlineDays: listing.invoiceDeadlineDays,
                sellerRegion: listing.sellerRegion,
              }}
            />
          </>
        ) : (
          <p className="mt-2 text-xs text-amber-700">Cuenta pendiente de aprobación</p>
        )}
      </div>
    </article>
  );
}
