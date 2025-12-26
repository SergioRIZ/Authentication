import { Suspense } from "react";
import AuthForm from "@/components/auth/auth-form";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthForm
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta"
      footerText="¿No tienes cuenta?"
      footerLinkText="Regístrate"
      footerLinkHref="/register"
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </AuthForm>
  );
}