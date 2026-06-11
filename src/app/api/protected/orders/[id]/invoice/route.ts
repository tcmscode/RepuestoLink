import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { submitInvoice } from "@/lib/services/orders";

const schema = z.object({
  filePath: z.string().optional(),
  numeroFactura: z.string().optional(),
  cae: z.string().optional(),
  monto: z.number().optional(),
  manualEntry: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "vendedor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = schema.parse(await req.json());
    const order = await submitInvoice(id, session.user.companyId, body);
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 400 }
    );
  }
}
