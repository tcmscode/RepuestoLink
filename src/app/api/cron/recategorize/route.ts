import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { runPeriodicCategoryReview } from "@/lib/services/recategorization";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await runPeriodicCategoryReview();
  return NextResponse.json({ ok: true, ...result });
}
