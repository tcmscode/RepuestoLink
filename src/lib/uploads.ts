import path from "path";

/**
 * Directorio de facturas subidas.
 * En Railway: montá un Volume en esta ruta (ej. /app/uploads).
 */
export function getUploadsDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
}

export function getUploadPublicPath(filename: string): string {
  return `/uploads/${filename}`;
}
