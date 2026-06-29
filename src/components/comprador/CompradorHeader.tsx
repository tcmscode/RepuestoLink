import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { getRecentSearches } from "@/lib/policies/listings";

export async function CompradorHeader({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const session = await auth();
  if (!session) return null;

  const [cartCount, recentSearches] = await Promise.all([
    prisma.cartItem.count({ where: { userId: session.user.id } }),
    getRecentSearches(session.user.id),
  ]);

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-[#fff159] px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 md:gap-4">
          <Link
            href="/comprador"
            className="shrink-0 text-xl font-bold tracking-tight text-[#2d3277]"
          >
            Repuesto<span className="text-[#3483fa]">Link</span>
          </Link>

          <SearchBar defaultQuery={searchQuery} recentSearches={recentSearches} />

          <nav className="ml-auto flex shrink-0 items-center gap-1 text-sm md:gap-3">
            <Link
              href="/comprador/pedidos"
              className="hidden rounded-md px-2 py-1.5 font-medium text-slate-800 hover:bg-black/5 sm:inline"
            >
              Mis pedidos
            </Link>
            <Link
              href="/comprador/pedidos"
              className="rounded-md px-2 py-1.5 font-medium text-slate-800 hover:bg-black/5 sm:hidden"
            >
              Pedidos
            </Link>
            <NotificationBell />
            <Link
              href="/comprador/carrito"
              data-testid="nav-cart"
              className="relative flex items-center rounded-md p-1.5 hover:bg-black/5"
              aria-label="Carrito"
            >
              <svg className="h-6 w-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3483fa] px-1 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
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

      <div className="border-b border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4">
          <span className="font-medium text-slate-800">{session.user.companyName}</span>
          <span className="hidden sm:inline">·</span>
          <span>Compará por SKU y OEM · Vendedor anónimo hasta confirmar</span>
        </div>
      </div>
    </header>
  );
}
