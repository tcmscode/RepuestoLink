import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card title="Ingresar a RepuestoLink">
        <p className="mb-4 text-sm text-slate-600">
          Acceso exclusivo para empresas dadas de alta por el administrador.
        </p>
        <LoginForm />
      </Card>
    </div>
  );
}
