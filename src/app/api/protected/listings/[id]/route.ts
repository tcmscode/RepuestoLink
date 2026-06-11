import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAllowedInvoiceDeadlineDays } from "@/lib/config/business";
import { syncListingPrimaryPrice } from "@/lib/config/categories";
import { inferCategoryId } from "@/lib/listing-display";

const patchSchema = z.object({
  sku: z.string().min(2).optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  priceContado: z.number().positive().optional().nullable(),
  price30: z.number().positive().optional().nullable(),
  price60: z.number().positive().optional().nullable(),
  price90: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  brand: z.string().optional().nullable(),
  category: z.string().optional(),
  vehicleCompatibility: z.string().optional().nullable(),
  condition: z.string().optional(),
  oemCodes: z.string().optional().nullable(),
  replacesOem: z.string().optional().nullable(),
  invoiceDeadlineDays: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "vendedor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.user.kycStatus !== "aprobado") {
    return NextResponse.json({ error: "Cuenta no aprobada" }, { status: 403 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!listing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    if (
      body.invoiceDeadlineDays != null &&
      !isAllowedInvoiceDeadlineDays(body.invoiceDeadlineDays)
    ) {
      return NextResponse.json({ error: "Plazo de factura inválido" }, { status: 400 });
    }

    const category =
      body.category && body.category !== "otro"
        ? body.category
        : body.title || body.brand
          ? inferCategoryId(body.title ?? listing.title, body.brand ?? listing.brand ?? undefined)
          : undefined;

    const tiers = {
      priceContado:
        body.priceContado !== undefined ? body.priceContado : listing.priceContado,
      price30: body.price30 !== undefined ? body.price30 : listing.price30,
      price60: body.price60 !== undefined ? body.price60 : listing.price60,
      price90: body.price90 !== undefined ? body.price90 : listing.price90,
    };
    const price = syncListingPrimaryPrice(tiers);
    if (price <= 0) {
      return NextResponse.json(
        { error: "Al menos un precio de lista debe estar cargado" },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.sku != null && { sku: body.sku.trim().toUpperCase() }),
        ...(body.title != null && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        price,
        ...tiers,
        ...(body.stock != null && { stock: body.stock }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(category != null && { category }),
        ...(body.vehicleCompatibility !== undefined && {
          vehicleCompatibility: body.vehicleCompatibility,
        }),
        ...(body.condition != null && { condition: body.condition }),
        ...(body.oemCodes !== undefined && { oemCodes: body.oemCodes }),
        ...(body.replacesOem !== undefined && { replacesOem: body.replacesOem }),
        ...(body.invoiceDeadlineDays != null && {
          invoiceDeadlineDays: body.invoiceDeadlineDays,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "vendedor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, companyId: session.user.companyId },
  });
  if (!listing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.listing.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
