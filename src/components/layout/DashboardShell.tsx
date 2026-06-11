import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardShell({
  title,
  nav,
  children,
  warning,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: ReactNode;
  warning?: string;
}) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-48 shrink-0 md:block">
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">{title}</h1>
        {warning && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {warning}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
