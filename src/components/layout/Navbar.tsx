import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export async function Navbar() {
  const session = await auth();

  if (session?.user.role === "comprador" || session?.user.role === "vendedor") {
    return null;
  }

  const dashboardLink =
    session?.user.role === "admin"
      ? "/admin"
      : session?.user.role === "vendedor"
        ? "/vendedor"
        : session?.user.role === "comprador"
          ? "/comprador"
          : null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-blue-900">
          Repuesto<span className="text-[#3483fa]">Link</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <span className="hidden text-slate-600 sm:inline">
                {session.user.companyName}
              </span>
              {dashboardLink && (
                <Link href={dashboardLink} className="text-blue-800 hover:underline">
                  Panel
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/registro" className="text-slate-700 hover:text-blue-800">
                Solicitar alta
              </Link>
              <Link href="/login">
                <Button size="sm">Ingresar</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
