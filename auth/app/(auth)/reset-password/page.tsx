import { Suspense } from "react";
import AuthForm from "@/components/auth/auth-form";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthForm
      title="Nueva contraseña"
      subtitle="Introduce tu nueva contraseña"
      footerText="¿Recordaste tu contraseña?"
      footerLinkText="Inicia sesión"
      footerLinkHref="/login"
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthForm>
  );
}