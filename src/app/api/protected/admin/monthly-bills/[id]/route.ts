import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markMonthlyBillPaid } from "@/lib/services/monthly-commission";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = z.object({ action: z.enum(["mark_paid"]) }).parse(await req.json());

  if (body.action === "mark_paid") {
    await markMonthlyBillPaid(id, session.user.email);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const bill = await prisma.monthlyCommissionBill.findUnique({
    where: { id },
    include: {
      sellerCompany: true,
      commissions: { include: { order: { select: { orderNumber: true } } } },
    },
  });
  if (!bill) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(bill);
}
