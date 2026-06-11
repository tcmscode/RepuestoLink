import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getListingDetailForBuyer,
  recordRecentlyViewed,
} from "@/lib/policies/listings";
import { CompradorShell } from "@/components/comprador/CompradorShell";
import { formatCurrency } from "@/lib/utils";
import { formatInvoiceDeadlineLabel } from "@/lib/config/business";
import {
  conditionBadgeClass,
  conditionLabel,
  getCategoryById,
  parseOemCodes,
} from "@/lib/listing-display";
import { CategoryIcon } from "@/components/comprador/CategoryIcon";
import { AddToCartButton } from "@/components/comprador/AddToCartButton";
import { CompareButton } from "@/components/comprador/CompareButton";
import { ProductGrid } from "@/components/comprador/ProductGrid";

export default async function RepuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const data = await getListingDetailForBuyer(id, session?.user.companyId);
  if (!data) notFound();

  if (session) {
    await recordRecentlyViewed(session.user.id, id);
  }

  const { listing, alternatives } = data;
  const canBuy = session?.user.kycStatus === "aprobado";
  const category = getCategoryById(listing.category);
  const oems = parseOemCodes(listing.oemCodes);

  return (
    <CompradorShell>
      <Link href="/comprador" className="mb-4 inline-block text-sm text-[#3483fa] hover:underline">
        ← Volver al buscador
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <div
                className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl ${category.bgClass}`}
              >
                <CategoryIcon categoryId={listing.category} className="h-12 w-12" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-sm font-bold text-white">
                    SKU: {listing.sku}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${conditionBadgeClass(listing.condition)}`}
                  >
                    {conditionLabel(listing.condition)}
                  </span>
                  {listing.sellerRegion && (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                      Envío desde {listing.sellerRegion}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
                {listing.brand && (
                  <p className="mt-1 text-lg text-slate-600">{listing.brand}</p>
                )}
              </div>
            </div>

            {listing.description && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900">Descripción</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {listing.description}
                </p>
              </div>
            )}

            {listing.vehicleCompatibility && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-slate-900">Compatibilidad</h2>
                <p className="mt-1 text-sm text-slate-600">{listing.vehicleCompatibility}</p>
              </div>
            )}

            {oems.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-slate-900">Códigos OEM</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {oems.map((code) => (
                    <span
                      key={code}
                      className="rounded border bg-slate-50 px-2 py-1 font-mono text-xs"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {listing.replacesOem && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <h2 className="text-sm font-semibold text-[#2d3277]">Equivalencias / reemplaza a</h2>
                <p className="mt-1 text-sm text-slate-700">{listing.replacesOem}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="sticky top-36 rounded-lg bg-white p-6 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(listing.price)}
            </p>
            {listing.minPriceSameSku &&
              listing.sameSkuCount &&
              listing.sameSkuCount > 1 &&
              listing.minPriceSameSku < listing.price && (
                <p className="mt-1 text-sm text-green-700">
                  Hay ofertas desde {formatCurrency(listing.minPriceSameSku)} para este SKU
                </p>
              )}
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Stock: {listing.stock} unidades</li>
              <li>Plazo factura vendedor: {formatInvoiceDeadlineLabel(listing.invoiceDeadlineDays)}</li>
              <li className="italic text-slate-400">Vendedor verificado al confirmar compra</li>
            </ul>
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
              <p className="mt-4 text-sm text-amber-700">Cuenta pendiente de aprobación</p>
            )}
          </div>
        </div>
      </div>

      {alternatives.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            Otras ofertas con SKU {listing.sku}
          </h2>
          <ProductGrid listings={alternatives} canBuy={!!canBuy} />
        </section>
      )}
    </CompradorShell>
  );
}
