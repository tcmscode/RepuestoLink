import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCuitWithAfip } from "@/lib/services/tax/verify-cuit";
import { maybeAutoProvisionAccessRequest } from "@/lib/services/onboarding-automation";

const schema = z.object({
  cuit: z.string().min(11).max(13),
  razonSocial: z.string().min(2),
  nombreFantasia: z.string().optional(),
  email: z.string().email(),
  telefono: z.string().optional(),
  roleRequested: z.enum(["comprador", "vendedor"]),
  tradeCategory: z.enum(["A", "B", "C", "D"]).default("B"),
  mensaje: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const cuit = body.cuit.replace(/\D/g, "");

    const afip = await verifyCuitWithAfip(
      cuit,
      body.roleRequested,
      body.razonSocial
    );
    if (!afip.ok) {
      return NextResponse.json({ error: afip.error ?? "CUIT no verificado" }, { status: 400 });
    }
    if (!afip.activityValid) {
      return NextResponse.json(
        {
          error:
            "La actividad registrada en ARCA no coincide con el tipo de cuenta solicitada",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.accessRequest.findFirst({
      where: { cuit, status: "pendiente" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya hay una solicitud pendiente con este CUIT" },
        { status: 409 }
      );
    }

    const existingCompany = await prisma.company.findUnique({ where: { cuit } });
    if (existingCompany) {
      return NextResponse.json({ error: "CUIT ya registrado en la plataforma" }, { status: 409 });
    }

    const request = await prisma.accessRequest.create({
      data: {
        cuit,
        razonSocial: afip.data?.razonSocial ?? body.razonSocial,
        nombreFantasia: body.nombreFantasia,
        email: body.email.toLowerCase(),
        telefono: body.telefono,
        roleRequested: body.roleRequested,
        tradeCategory: body.tradeCategory,
        mensaje: body.mensaje,
        afipVerified: true,
        afipDataJson: afip.data ? JSON.stringify(afip.data) : null,
      },
    });

    const auto = await maybeAutoProvisionAccessRequest(request.id);

    return NextResponse.json({
      ok: true,
      id: request.id,
      afipVerified: true,
      autoProvisioned: auto.provisioned,
      ...(auto.provisioned
        ? {
            message:
              "Cuenta creada automágicamente. Revisá tu email para la contraseña temporal.",
          }
        : {
            message:
              "Solicitud recibida. Un administrador revisará tus datos en 48 horas.",
          }),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 });
  }
}
