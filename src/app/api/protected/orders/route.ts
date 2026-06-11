import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/services/orders";

const schema = z.object({ sellerCompanyId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.user.kycStatus !== "aprobado") {
    return NextResponse.json({ error: "Cuenta no aprobada" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    const order = await createOrderFromCart(
      session.user.companyId,
      session.user.id,
      body.sellerCompanyId
    );
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}
