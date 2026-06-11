import { auth, requireApprovedKyc } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getListingsForSeller } from "@/lib/policies/listings";
import type { Listing } from "@prisma/client";
import { VendedorShell } from "@/components/vendedor/VendedorShell";
import { PanelHeading } from "@/components/vendedor/PanelHeading";
import { ListingForm } from "./ListingForm";
import { formatCurrency } from "@/lib/utils";
import { DeleteListingButton } from "./DeleteListingButton";
import { EditListingButton } from "./EditListingButton";

export default async function StockPage() {
  const session = await auth();
  let listings: Listing[] = [];
  let sellerCategory = "B";
  try {
    await requireApprovedKyc();
    listings = await getListingsForSeller(session!.user.companyId);
    const company = await prisma.company.findUnique({
      where: { id: session!.user.companyId },
      select: { tradeCategory: true },
    });
    sellerCategory = company?.tradeCategory ?? "B";
  } catch {
    // pendiente KYC
  }

  const warning =
    session!.user.kycStatus !== "aprobado"
      ? "Tu cuenta debe estar aprobada para publicar y editar stock."
      : undefined;

  return (
    <VendedorShell warning={warning}>
      <PanelHeading
        title="Mi stock"
        subtitle={`${listings.length} publicación${listings.length === 1 ? "" : "es"} · Cat. ${sellerCategory}`}
      />

      {session!.user.kycStatus === "aprobado" ? (
        <>
          <ListingForm sellerCategory={sellerCategory} />
          <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium">Título</th>
                  <th className="p-3 font-medium">Contado</th>
                  <th className="p-3 font-medium">30d</th>
                  <th className="p-3 font-medium">60d</th>
                  <th className="p-3 font-medium">90d</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Todavía no tenés publicaciones. Creá la primera arriba.
                    </td>
                  </tr>
                ) : (
                  listings.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="p-3 font-mono text-xs">{l.sku}</td>
                      <td className="p-3">{l.title}</td>
                      <td className="p-3">
                        {l.priceContado ? formatCurrency(l.priceContado) : "—"}
                      </td>
                      <td className="p-3">
                        {l.price30 ? formatCurrency(l.price30) : "—"}
                      </td>
                      <td className="p-3">
                        {l.price60 ? formatCurrency(l.price60) : "—"}
                      </td>
                      <td className="p-3">
                        {l.price90 ? formatCurrency(l.price90) : "—"}
                      </td>
                      <td className="p-3">{l.stock}</td>
                      <td className="space-x-2 p-3">
                        <EditListingButton listing={l} sellerCategory={sellerCategory} />
                        <DeleteListingButton listingId={l.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center text-slate-600 shadow-sm">
          Esperá la aprobación de tu cuenta para cargar stock.
        </div>
      )}
    </VendedorShell>
  );
}
