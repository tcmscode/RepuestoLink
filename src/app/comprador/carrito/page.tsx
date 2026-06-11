import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CompradorShell } from "@/components/comprador/CompradorShell";
import { formatCurrency } from "@/lib/utils";
import { getPriceForCategory, isTradeCategory } from "@/lib/config/categories";
import { CheckoutButton } from "./CheckoutButton";
import { RemoveFromCartButton } from "./RemoveFromCartButton";
import { CartQuantityControl } from "./CartQuantityControl";

export default async function CarritoPage() {
  const session = await auth();
  const buyerCompany = await prisma.company.findUnique({
    where: { id: session!.user.companyId },
    select: { tradeCategory: true },
  });
  const paymentCat = isTradeCategory(buyerCompany?.tradeCategory ?? "")
    ? buyerCompany!.tradeCategory
    : "B";

  const items = await prisma.cartItem.findMany({
    where: { userId: session!.user.id },
    include: { listing: true },
  });

  const bySeller = items.reduce(
    (acc, item) => {
      const sid = item.listing.companyId;
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  return (
    <CompradorShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Carrito</h1>
        <Link href="/comprador" className="text-sm text-[#3483fa] hover:underline">
          ← Seguir buscando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Tu carrito está vacío.</p>
          <Link
            href="/comprador"
            className="mt-4 inline-block text-sm font-medium text-[#3483fa] hover:underline"
          >
            Buscar repuestos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(bySeller).map(([sellerId, sellerItems]) => {
            const subtotal = sellerItems.reduce((s, i) => {
              const unit =
                getPriceForCategory(i.listing, paymentCat as "A" | "B" | "C" | "D") ??
                i.listing.price;
              return s + unit * i.quantity;
            }, 0);
            return (
              <div key={sellerId} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-slate-500">
                  Vendedor: <span className="italic">se revela al confirmar</span>
                </p>
                <ul className="space-y-2">
                  {sellerItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{item.listing.title}</span>
                        {item.listing.sku && (
                          <span className="ml-2 font-mono text-xs text-slate-400">
                            {item.listing.sku}
                          </span>
                        )}
                        <div className="mt-1">
                          <CartQuantityControl
                            listingId={item.listingId}
                            quantity={item.quantity}
                            maxStock={item.listing.stock}
                          />
                        </div>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(
                          (getPriceForCategory(
                            item.listing,
                            paymentCat as "A" | "B" | "C" | "D"
                          ) ?? item.listing.price) * item.quantity
                        )}
                      </span>
                      <RemoveFromCartButton listingId={item.listingId} />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-lg font-bold">{formatCurrency(subtotal)}</p>
                {session!.user.kycStatus === "aprobado" && (
                  <CheckoutButton sellerCompanyId={sellerId} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </CompradorShell>
  );
}
