import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  status: z.enum(["pendiente", "contactado", "rechazado", "aprobado"]),
  adminNotes: z.string().optional(),
});

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

  const updated = await prisma.accessRequest.update({
    where: { id },
    data: {
      status: body.status,
      adminNotes: body.adminNotes,
    },
  });

  return NextResponse.json(updated);
}
