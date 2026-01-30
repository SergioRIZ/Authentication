import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProtectedNav } from "@/components/layout/protected-nav";
import ProfileForm from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedNav
        user={user}
        signOutAction={handleSignOut}
      />

      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Mi Perfil</h1>

        <div className="bg-background border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Editar perfil
          </h2>
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
