import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
    select: {
      password: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const hasPassword = !!user.password;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Configuración</h1>

      {/* Two-Factor Authentication */}
      <div className="bg-background border border-border rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Autenticación de dos factores (2FA)
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Añade una capa adicional de seguridad a tu cuenta usando una app de autenticación.
        </p>
        {hasPassword ? (
          <TwoFactorSetup />
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              La autenticación de dos factores solo está disponible para cuentas con contraseña.
              Tu cuenta usa inicio de sesión con Google.
            </p>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-background border border-border rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Cambiar contraseña
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Actualiza tu contraseña para mantener tu cuenta segura.
        </p>

        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Tu cuenta usa inicio de sesión con Google. No tienes una contraseña configurada.
            </p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-background border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
          Zona de peligro
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Acciones irreversibles para tu cuenta.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
