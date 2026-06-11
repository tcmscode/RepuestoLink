import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      )}
      {children}
    </div>
  );
}
