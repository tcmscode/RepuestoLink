import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import {
  generateMonthlyCommissionBills,
  suspendOverdueCommissionBills,
} from "@/lib/services/monthly-commission";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prev.getFullYear();
  const month = prev.getMonth() + 1;

  const generated = await generateMonthlyCommissionBills(year, month);
  const suspended = await suspendOverdueCommissionBills();

  return NextResponse.json({
    ok: true,
    period: `${month}/${year}`,
    generated,
    suspended,
  });
}
