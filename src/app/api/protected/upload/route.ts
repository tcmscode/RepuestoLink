import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadPublicPath, getUploadsDir } from "@/lib/uploads";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = getUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  await writeFile(path.join(uploadsDir, safeName), buffer);

  return NextResponse.json({ path: getUploadPublicPath(safeName) });
}
