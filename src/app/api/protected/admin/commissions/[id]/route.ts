import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ status: z.enum(["pendiente", "pagado"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = schema.parse(await req.json());

  const commission = await prisma.commission.update({
    where: { id },
    data: { status: body.status },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.user.email,
      action: `COMMISSION_${body.status.toUpperCase()}`,
      entityType: "Commission",
      entityId: id,
    },
  });

  return NextResponse.json(commission);
}
