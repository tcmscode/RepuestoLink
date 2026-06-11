import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { blockBridgePairPermanently } from "@/lib/services/bridge-detection";

const schema = z.object({
  buyerCompanyId: z.string(),
  sellerCompanyId: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = schema.parse(await req.json());
  await blockBridgePairPermanently(
    body.buyerCompanyId,
    body.sellerCompanyId,
    session.user.email
  );
  return NextResponse.json({ ok: true });
}
