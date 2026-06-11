import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CompradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || (session.user.role !== "comprador" && session.user.role !== "admin")) {
    redirect("/login");
  }
  return <>{children}</>;
}
