"use client";

export type CompareItem = {
  id: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
  brand: string | null;
  condition: string;
  invoiceDeadlineDays: number;
  sellerRegion: string | null;
};

const KEY = "apppesados-compare";
const MAX = 3;

export function getCompareItems(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CompareItem[];
  } catch {
    return [];
  }
}

export function setCompareItems(items: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event("compare-updated"));
}

export function addToCompare(item: CompareItem): boolean {
  const current = getCompareItems();
  if (current.some((c) => c.id === item.id)) return true;
  if (current.length >= MAX) return false;
  setCompareItems([...current, item]);
  return true;
}

export function removeFromCompare(id: string) {
  setCompareItems(getCompareItems().filter((c) => c.id !== id));
}

export function clearCompare() {
  setCompareItems([]);
}
