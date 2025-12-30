import AuthForm from "@/components/auth/auth-form";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="¿Olvidaste tu contraseña?"
      subtitle="Te enviaremos un enlace para restablecerla"
      footerText="¿Recordaste tu contraseña?"
      footerLinkText="Inicia sesión"
      footerLinkHref="/login"
    >
      <ForgotPasswordForm />
    </AuthForm>
  );
}