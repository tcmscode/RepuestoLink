import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || (session.user.role !== "vendedor" && session.user.role !== "admin")) {
    redirect("/login");
  }
  return children;
}
