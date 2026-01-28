import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChangePasswordForm from "@/components/settings/change-password-form";
import DeleteAccountButton from "@/components/settings/delete-account-button";
import TwoFactorSetup from "@/components/settings/two-factor-setup";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { password: true },
  });

  const hasPassword = !!user?.password;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Autenticación de dos factores (2FA)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Añade una capa adicional de seguridad a tu cuenta usando una app de autenticación.
          </p>
          {hasPassword ? (
            <TwoFactorSetup />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                La autenticación de dos factores solo está disponible para cuentas con contraseña.
                Tu cuenta usa inicio de sesión con Google.
              </p>
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Actualiza tu contraseña para mantener tu cuenta segura.
          </p>

          {hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Tu cuenta usa inicio de sesión con Google. No tienes una contraseña configurada.
              </p>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Zona de peligro
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Acciones irreversibles para tu cuenta.
          </p>
          <DeleteAccountButton />
        </div>
      </main>
    </div>
  );
}
