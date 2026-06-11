import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordCancellationAndEvaluate } from "@/lib/services/abuse";
import { restoreStockForOrder } from "@/lib/services/orders";

const schema = z.object({ reason: z.string().optional() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = schema.parse(await req.json().catch(() => ({})));

  const order = await prisma.order.findFirst({
    where: {
      id,
      buyerCompanyId: session.user.companyId,
      status: { in: ["borrador", "pendiente_vendedor", "confirmado"] },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status === "confirmado" && order.confirmedAt) {
    const hoursSince =
      (Date.now() - order.confirmedAt.getTime()) / (1000 * 60 * 60);
    await recordCancellationAndEvaluate(
      session.user.companyId,
      order.id,
      hoursSince
    );
  }

  if (order.status === "confirmado") {
    await restoreStockForOrder(order.id);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "cancelado",
      cancelledAt: new Date(),
      cancelReason: body.reason,
    },
  });

  return NextResponse.json(updated);
}
