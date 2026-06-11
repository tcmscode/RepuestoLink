import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSearchSuggestions } from "@/lib/policies/listings";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "comprador" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const suggestions = await getSearchSuggestions(q);
  return NextResponse.json({ suggestions });
}
