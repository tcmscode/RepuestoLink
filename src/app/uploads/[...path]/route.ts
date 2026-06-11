import { getUploadsDir } from "@/lib/uploads";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

/** Sirve facturas cuando UPLOAD_DIR está fuera de /public (ej. Volume en Railway) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");
  if (!filename || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const filePath = path.join(getUploadsDir(), filename);
    const data = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
