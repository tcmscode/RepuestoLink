import { NextResponse } from "next/server";
import { processOverdueInvoices } from "@/lib/services/invoices-cron";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const results = await processOverdueInvoices();
  return NextResponse.json({
    processed: results.length,
    results,
  });
}
