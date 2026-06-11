import { redirect } from "next/navigation";

/** Catálogo unificado en /comprador */
export default async function CatalogoRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const url = q ? `/comprador?q=${encodeURIComponent(q)}` : "/comprador";
  redirect(url);
}
