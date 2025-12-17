import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  
  // Verificación: si no hay sesión, redirigir
  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardClient user={session.user} />;
}