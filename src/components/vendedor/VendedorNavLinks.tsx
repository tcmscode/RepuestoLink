"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VENDEDOR_NAV } from "@/lib/vendedor-nav";
import { cn } from "@/lib/utils";

export function VendedorNavLinks({
  badges = {},
  compact = false,
}: {
  badges?: Record<string, number>;
  compact?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/vendedor") return pathname === "/vendedor";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className={cn(
        "flex gap-1",
        compact ? "flex-wrap justify-center" : "flex-wrap items-center"
      )}
    >
      {VENDEDOR_NAV.map((item) => {
        const active = isActive(item.href);
        const badge = badges[item.href];
        const label = compact ? item.shortLabel : item.label;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative rounded-md px-2.5 py-1.5 text-sm font-medium transition",
              active
                ? "bg-[#3483fa] text-white shadow-sm"
                : "text-slate-800 hover:bg-black/5"
            )}
          >
            {label}
            {badge != null && badge > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-white text-[#3483fa]" : "bg-[#3483fa] text-white"
                )}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
