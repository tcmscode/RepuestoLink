import type { JSX } from "react";
import { getCategoryById } from "@/lib/listing-display";

export function CategoryIcon({
  categoryId,
  className = "h-8 w-8",
}: {
  categoryId: string;
  className?: string;
}) {
  const cat = getCategoryById(categoryId);
  const color = cat.textClass.replace("text-", "stroke-");

  const paths: Record<string, JSX.Element> = {
    frenos: (
      <circle cx="12" cy="12" r="9" strokeWidth="2" fill="none" className={color} />
    ),
    filtros: (
      <path
        d="M4 6h16M6 12h12M8 18h8"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        className={color}
      />
    ),
    motor: (
      <path
        d="M12 4v4m0 8v4M4 12h4m8 0h4M7 7l3 3m4 4l3 3M7 17l3-3m4-4l3-3"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        className={color}
      />
    ),
    transmision: (
      <path
        d="M8 12h8M12 8v8"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        className={color}
      />
    ),
    carroceria: (
      <rect
        x="5"
        y="8"
        width="14"
        height="10"
        rx="1"
        strokeWidth="2"
        fill="none"
        className={color}
      />
    ),
    suspension: (
      <path
        d="M8 16V8l4-4 4 4v8"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        className={color}
      />
    ),
    electrico: (
      <path
        d="M13 3L6 14h6l-1 7 7-11h-6l1-7z"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        className={color}
      />
    ),
    otro: (
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        strokeWidth="2"
        fill="none"
        className={color}
      />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      role="img"
    >
      {paths[categoryId] ?? paths.otro}
    </svg>
  );
}
