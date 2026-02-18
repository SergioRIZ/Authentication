import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Mi Perfil</h1>

      <div className="bg-background border border-border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Editar perfil
        </h2>
        <ProfileForm />
      </div>
    </div>
  );
}
