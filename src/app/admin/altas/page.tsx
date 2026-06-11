import { DashboardShell } from "@/components/layout/DashboardShell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { CreateUserForm } from "./CreateUserForm";

export default function AdminAltasPage() {
  return (
    <DashboardShell title="Alta manual de usuarios" nav={[...ADMIN_NAV]}>
      <p className="mb-6 text-sm text-slate-600">
        Creá empresas y usuarios aprobados. Solo ellos podrán iniciar sesión. El
        registro público está deshabilitado.
      </p>
      <CreateUserForm />
    </DashboardShell>
  );
}
