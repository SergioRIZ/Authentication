import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Bienvenido{session.user.name ? `, ${session.user.name}` : ""}!
          </h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>Email:</strong> {session.user.email}</p>
            {session.user.name && <p><strong>Nombre:</strong> {session.user.name}</p>}
            {session.user.image && (
              <div className="mt-4">
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}