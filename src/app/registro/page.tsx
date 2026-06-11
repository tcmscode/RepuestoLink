import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AccessRequestForm } from "./AccessRequestForm";

export default function RegistroPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card title="Solicitar alta en RepuestoLink">
        <p className="mb-4 text-slate-600">
          RepuestoLink es una red cerrada de empresas del rubro. Verificamos tu CUIT
          en ARCA antes de registrar la solicitud.
        </p>
        <p className="text-slate-600">
          Con volumen alto de solicitudes, el alta puede automatizarse si la actividad
          coincide con el rol solicitado.
        </p>
        <AccessRequestForm />
        <Link href="/login" className="mt-6 block">
          <Button variant="secondary" className="w-full">
            Ya tengo cuenta — Ingresar
          </Button>
        </Link>
        <Link href="/" className="mt-3 block text-center text-sm text-blue-800 hover:underline">
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
