import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAllowedInvoiceDeadlineDays } from "@/lib/config/business";
import {
  syncListingPrimaryPrice,
  TRADE_CATEGORIES,
} from "@/lib/config/categories";
import { inferCategoryId } from "@/lib/listing-display";

const tierSchema = z.object({
  priceContado: z.number().positive().optional(),
  price30: z.number().positive().optional(),
  price60: z.number().positive().optional(),
  price90: z.number().positive().optional(),
});

const schema = tierSchema.merge(
  z.object({
    sku: z.string().min(2, "SKU obligatorio (mín. 2 caracteres)"),
    title: z.string().min(2),
    description: z.string().optional(),
    stock: z.number().int().min(0),
    brand: z.string().optional(),
    category: z.string().optional(),
    vehicleCompatibility: z.string().optional(),
    condition: z.string().default("nuevo"),
    oemCodes: z.string().optional(),
    replacesOem: z.string().optional(),
    invoiceDeadlineDays: z.number().int().optional(),
  })
);

function parseTiers(body: z.infer<typeof schema>) {
  const tiers = {
    priceContado: body.priceContado ?? null,
    price30: body.price30 ?? null,
    price60: body.price60 ?? null,
    price90: body.price90 ?? null,
  };
  const price = syncListingPrimaryPrice(tiers);
  if (price <= 0) {
    throw new Error("Ingresá al menos un precio en una lista (contado, 30, 60 o 90 días)");
  }
  return { tiers, price };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "vendedor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.user.kycStatus !== "aprobado") {
    return NextResponse.json({ error: "Cuenta no aprobada" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    if (
      body.invoiceDeadlineDays != null &&
      !isAllowedInvoiceDeadlineDays(body.invoiceDeadlineDays)
    ) {
      return NextResponse.json(
        { error: "Plazo de factura inválido (máximo 3 meses)" },
        { status: 400 }
      );
    }

    const { tiers, price } = parseTiers(body);

    const category =
      body.category && body.category !== "otro"
        ? body.category
        : inferCategoryId(body.title, body.brand);

    const seller = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { tradeCategory: true },
    });
    const sellerCat = seller?.tradeCategory ?? "B";
    const catField = TRADE_CATEGORIES.includes(
      sellerCat as (typeof TRADE_CATEGORIES)[number]
    )
      ? ({
          A: "priceContado",
          B: "price30",
          C: "price60",
          D: "price90",
        }[sellerCat as "A" | "B" | "C" | "D"] as keyof typeof tiers)
      : "price30";
    if (!tiers[catField]) {
      return NextResponse.json(
        {
          error: `Debés cargar el precio para tu categoría de operación (${sellerCat})`,
        },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        sku: body.sku.trim().toUpperCase(),
        title: body.title,
        description: body.description,
        price,
        ...tiers,
        stock: body.stock,
        brand: body.brand,
        category,
        vehicleCompatibility: body.vehicleCompatibility,
        condition: body.condition,
        oemCodes: body.oemCodes,
        replacesOem: body.replacesOem,
        invoiceDeadlineDays: body.invoiceDeadlineDays ?? 30,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(listing);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const msg = e.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Datos inválidos" },
      { status: 400 }
    );
  }
}
