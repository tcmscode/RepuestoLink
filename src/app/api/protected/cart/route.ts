import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getPriceForCategory,
  isTradeCategory,
} from "@/lib/config/categories";

const postSchema = z.object({
  listingId: z.string(),
  quantity: z.number().int().positive().default(1),
});

const patchSchema = z.object({
  listingId: z.string(),
  quantity: z.number().int().min(0),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { listing: { include: { company: true } } },
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      listingId: i.listingId,
      quantity: i.quantity,
      title: i.listing.title,
      price: i.listing.price,
      stock: i.listing.stock,
      sellerCompanyId: i.listing.companyId,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (session.user.kycStatus !== "aprobado") {
    return NextResponse.json({ error: "Cuenta no aprobada" }, { status: 403 });
  }

  const buyer = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { tradeCategory: true },
  });
  const paymentCat = isTradeCategory(buyer?.tradeCategory ?? "")
    ? buyer!.tradeCategory
    : "B";

  const body = postSchema.parse(await req.json());
  const listing = await prisma.listing.findFirst({
    where: {
      id: body.listingId,
      isActive: true,
      stock: { gt: 0 },
      company: {
        kycStatus: "aprobado",
        role: "vendedor",
        listingsSuspended: false,
        tradeCategory: paymentCat,
      },
    },
  });
  if (!listing) {
    return NextResponse.json(
      { error: "Publicación no disponible para tu categoría" },
      { status: 404 }
    );
  }
  const unitPrice = getPriceForCategory(
    listing,
    paymentCat as "A" | "B" | "C" | "D"
  );
  if (unitPrice == null) {
    return NextResponse.json(
      { error: "Sin precio para tu condición de pago" },
      { status: 400 }
    );
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: body.listingId,
      },
    },
  });

  const newQty = Math.min(
    (existing?.quantity ?? 0) + body.quantity,
    listing.stock
  );
  if (newQty < 1) {
    return NextResponse.json({ error: "Sin stock disponible" }, { status: 400 });
  }

  await prisma.cartItem.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: body.listingId,
      },
    },
    create: {
      userId: session.user.id,
      listingId: body.listingId,
      quantity: Math.min(body.quantity, listing.stock),
    },
    update: { quantity: newQty },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = patchSchema.parse(await req.json());

  if (body.quantity === 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, listingId: body.listingId },
    });
    return NextResponse.json({ ok: true });
  }

  const listing = await prisma.listing.findFirst({
    where: { id: body.listingId, isActive: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no disponible" }, { status: 404 });
  }

  const quantity = Math.min(body.quantity, listing.stock);
  if (quantity < 1) {
    return NextResponse.json({ error: "Sin stock disponible" }, { status: 400 });
  }

  await prisma.cartItem.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: body.listingId,
      },
    },
    create: {
      userId: session.user.id,
      listingId: body.listingId,
      quantity,
    },
    update: { quantity },
  });

  return NextResponse.json({ ok: true, quantity });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "comprador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { listingId } = await req.json();
  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, listingId },
  });
  return NextResponse.json({ ok: true });
}
