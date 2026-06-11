import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/comprador/NotificationBell";
import { VendedorNavLinks } from "./VendedorNavLinks";

export async function VendedorHeader() {
  const session = await auth();
  if (!session) return null;

  const companyId = session.user.companyId;

  const activeOrders = await prisma.order.count({
    where: {
      sellerCompanyId: companyId,
      status: { in: ["confirmado", "factura_pendiente", "factura_revision"] },
    },
  });

  const badges: Record<string, number> = {};
  if (activeOrders > 0) badges["/vendedor/pedidos"] = activeOrders;

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-[#fff159] px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 md:gap-4">
          <Link
            href="/vendedor"
            className="shrink-0 text-xl font-bold tracking-tight text-[#2d3277]"
          >
            Repuesto<span className="text-[#3483fa]">Link</span>
            <span className="ml-1 hidden text-sm font-semibold text-slate-700 sm:inline">
              · Vendedor
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <VendedorNavLinks badges={badges} />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1 text-sm md:gap-2">
            <NotificationBell />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="text-slate-800">
                Salir
              </Button>
            </form>
          </nav>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-600 sm:text-sm">
              <span className="font-medium text-slate-800">{session.user.companyName}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">
                Gestioná tu stock, pedidos y facturas
              </span>
            </div>
            <div className="md:hidden">
              <VendedorNavLinks badges={badges} compact />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
