import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CompanyActions } from "./CompanyActions";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default async function AdminEmpresasPage() {
  const companies = await prisma.company.findMany({
    where: { role: { not: "admin" } },
    include: { users: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell title="Empresas" nav={[...ADMIN_NAV]}>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Razón social</th>
              <th className="p-3">CUIT</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Cat.</th>
              <th className="p-3">KYC</th>
              <th className="p-3">Trust</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.razonSocial}</td>
                <td className="p-3">{c.cuit}</td>
                <td className="p-3">{c.role}</td>
                <td className="p-3">{c.tradeCategory}</td>
                <td className="p-3">
                  <span
                    className={
                      c.kycStatus === "aprobado"
                        ? "text-green-700"
                        : c.kycStatus === "bloqueado"
                          ? "text-red-700"
                          : "text-amber-700"
                    }
                  >
                    {c.kycStatus}
                  </span>
                </td>
                <td className="p-3">{c.trustScore}</td>
                <td className="p-3">
                  <CompanyActions
                    companyId={c.id}
                    kycStatus={c.kycStatus}
                    tradeCategory={c.tradeCategory}
                    role={c.role}
                    manualReviewRequired={c.manualReviewRequired}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
