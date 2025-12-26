import AuthForm from "@/components/auth/auth-form";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Crear cuenta"
      subtitle="Regístrate para comenzar"
      footerText="¿Ya tienes cuenta?"
      footerLinkText="Inicia sesión"
      footerLinkHref="/login"
    >
      <RegisterForm />
    </AuthForm>
  );
}