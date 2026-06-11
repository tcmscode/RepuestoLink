import { NextResponse } from "next/server";

/** Registro público deshabilitado: altas solo por administración manual */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "El alta en AppPesados es solo por invitación. Contactá al administrador de la plataforma.",
    },
    { status: 403 }
  );
}
