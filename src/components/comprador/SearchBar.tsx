"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({
  defaultQuery = "",
  recentSearches = [],
}: {
  defaultQuery?: string;
  recentSearches?: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `/api/protected/search/suggest?q=${encodeURIComponent(term)}`
    );
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    }
  }, []);

  useEffect(() => {
    setQ(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, fetchSuggestions]);

  function submit(searchTerm?: string) {
    const term = (searchTerm ?? q).trim();
    const params = new URLSearchParams(window.location.search);
    if (term) params.set("q", term);
    else params.delete("q");
    params.delete("page");
    router.push(`/comprador?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative order-3 min-w-0 flex-1 basis-full md:order-none md:basis-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center"
        role="search"
      >
        <input
          type="search"
          value={q}
          data-testid="search-input"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por SKU, código OEM, marca, modelo..."
          className="h-10 min-w-0 flex-1 rounded-l-md border border-slate-300 bg-white px-3 text-sm shadow-inner focus:border-[#3483fa] focus:outline-none focus:ring-1 focus:ring-[#3483fa]"
          autoComplete="off"
        />
        <button
          type="submit"
          data-testid="search-submit"
          className="flex h-10 items-center justify-center rounded-r-md bg-[#ededed] px-4 hover:bg-[#e0e0e0]"
          aria-label="Buscar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>

      {open && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <button
              key={`s-${s}`}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              onMouseDown={() => submit(s)}
            >
              {s}
            </button>
          ))}
          {suggestions.length === 0 &&
            recentSearches.map((s) => (
              <button
                key={`r-${s}`}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                onMouseDown={() => submit(s)}
              >
                Reciente: {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
