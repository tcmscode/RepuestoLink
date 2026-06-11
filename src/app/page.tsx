import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { COMMISSION_PERCENT } from "@/lib/config/business";

export default async function HomePage() {
  const session = await auth();

  const panelHref =
    session?.user.role === "admin"
      ? "/admin"
      : session?.user.role === "vendedor"
        ? "/vendedor"
        : session?.user.role === "comprador"
          ? "/comprador"
          : "/login";

  return (
    <div>
      <section className="bg-gradient-to-br from-[#2d3277] to-blue-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[#3483fa]">
            RepuestoLink · Marketplace B2B · Argentina
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
            El mejor precio de repuestos pesados, con anonimato hasta cerrar la operación
          </h1>
          <p className="mb-8 text-lg text-blue-100">
            Intermediario tecnológico puro: sin stock, sin cobro, sin logística. Cuatro
            listas de precio, categorías cruzadas A–D, comisión del {COMMISSION_PERCENT}%
            solo al vendedor.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={session ? panelHref : "/login"}>
              <Button size="lg" className="bg-[#3483fa] hover:bg-[#2968c8]">
                {session ? "Ir a mi panel" : "Ingresar"}
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="lg" variant="secondary">
                Solicitar alta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Verificación ARCA">
            <p className="text-slate-600">
              Validamos CUIT y actividad en AFIP. Compradores de transporte y
              distribuidoras verificadas — sin espías ni competidores disfrazados.
            </p>
          </Card>
          <Card title="Anonimato bilateral">
            <p className="text-slate-600">
              Nadie ve identidad hasta que el vendedor acepta. Cuatro precios por lista
              (contado, 30, 60, 90 días) según tu categoría de pago.
            </p>
          </Card>
          <Card title="Reputación y control">
            <p className="text-slate-600">
              Calificaciones 1–5 estrellas, detección de abuso y puenteo, facturación
              mensual de comisiones con suspensión automática si no se abona.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
