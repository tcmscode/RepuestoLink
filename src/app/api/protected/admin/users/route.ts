import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";

import { isTradeCategory } from "@/lib/config/categories";
import { verifyCuitWithAfip, normalizeCuit } from "@/lib/services/tax/verify-cuit";

const schema = z.object({
  role: z.enum(["comprador", "vendedor"]),
  tradeCategory: z.enum(["A", "B", "C", "D"]).default("B"),
  cuit: z.string().min(11).max(13),
  razonSocial: z.string().min(2),
  nombreFantasia: z.string().optional(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  telefono: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(12),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const passwordError = validatePassword(body.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const cuit = normalizeCuit(body.cuit);
    const afip = await verifyCuitWithAfip(cuit, body.role, body.razonSocial);
    if (!afip.ok) {
      return NextResponse.json({ error: afip.error ?? "CUIT inválido" }, { status: 400 });
    }
    if (!afip.activityValid) {
      return NextResponse.json(
        { error: "Actividad ARCA incompatible con el rol" },
        { status: 400 }
      );
    }

    const existingCuit = await prisma.company.findUnique({
      where: { cuit },
    });
    if (existingCuit) {
      return NextResponse.json({ error: "CUIT ya registrado" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          cuit,
          razonSocial: afip.data?.razonSocial ?? body.razonSocial,
          nombreFantasia: body.nombreFantasia,
          provincia: body.provincia,
          localidad: body.localidad,
          telefono: body.telefono,
          role: body.role,
          tradeCategory: body.tradeCategory,
          kycStatus: "aprobado",
          afipVerifiedAt: new Date(),
          afipDataJson: afip.data ? JSON.stringify(afip.data) : null,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: body.name,
          passwordHash,
          companyId: company.id,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: company.id,
          actorEmail: session.user.email,
          action: "ADMIN_ALTA_MANUAL",
          entityType: "Company",
          entityId: company.id,
          metadata: JSON.stringify({ userId: user.id, role: body.role }),
        },
      });

      return { company, user };
    });

    return NextResponse.json({
      ok: true,
      companyId: result.company.id,
      userId: result.user.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
