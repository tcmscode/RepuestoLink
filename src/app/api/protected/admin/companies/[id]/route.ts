import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clearManualReview } from "@/lib/services/abuse";

const schema = z.object({
  kycStatus: z.enum(["pendiente", "aprobado", "bloqueado"]).optional(),
  kycNotes: z.string().optional(),
  tradeCategory: z.enum(["A", "B", "C", "D"]).optional(),
  clearManualReview: z.boolean().optional(),
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

  if (body.clearManualReview) {
    await clearManualReview(id, session.user.email);
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(body.kycStatus != null && { kycStatus: body.kycStatus }),
      ...(body.kycNotes !== undefined && { kycNotes: body.kycNotes }),
      ...(body.tradeCategory != null && { tradeCategory: body.tradeCategory }),
      ...(body.kycStatus === "aprobado" && { cooldownUntil: null }),
    },
  });

  if (body.tradeCategory) {
    await prisma.auditLog.create({
      data: {
        companyId: id,
        actorEmail: session.user.email,
        action: "TRADE_CATEGORY_UPDATE",
        entityType: "Company",
        entityId: id,
        metadata: JSON.stringify({ tradeCategory: body.tradeCategory }),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      companyId: id,
      actorEmail: session.user.email,
      action: `KYC_${body.kycStatus?.toUpperCase()}`,
      entityType: "Company",
      entityId: id,
    },
  });

  return NextResponse.json(company);
}
