import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { approveInvoice, rejectInvoice } from "@/lib/services/orders";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { orderId } = await params;
  const body = schema.parse(await req.json());

  try {
    if (body.action === "approve") {
      const order = await approveInvoice(orderId, body.adminNotes);
      return NextResponse.json(order);
    }
    if (!body.adminNotes?.trim()) {
      return NextResponse.json(
        { error: "Indicá el motivo del rechazo" },
        { status: 400 }
      );
    }
    const order = await rejectInvoice(orderId, body.adminNotes.trim());
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}
