import { type ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CompanyLogo, CompanyBanner, UsersGroupIcon, ClipboardListIcon,
  BarChartIcon, LockIcon, CalendarIcon, EmailIcon,
} from "@/components/ui/icons";

const features: { icon: ReactNode; title: string; description: string; color: string }[] = [
  {
    icon: <UsersGroupIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
    title: "Gestion de Clientes",
    description: "Mantiene todos los datos de tus clientes organizados. Historial, contactos y seguimiento en un solo lugar.",
    color: "teal",
  },
  {
    icon: <ClipboardListIcon className="w-6 h-6 text-green-600 dark:text-green-400" />,
    title: "Control de Equipos",
    description: "Asigna tareas, monitorea el progreso y gestiona los horarios de tu equipo de trabajo de forma eficiente.",
    color: "green",
  },
  {
    icon: <BarChartIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    title: "Reportes y Analisis",
    description: "Visualiza metricas clave de rendimiento. Toma decisiones informadas con datos en tiempo real.",
    color: "purple",
  },
  {
    icon: <LockIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    title: "Seguridad Avanzada",
    description: "Autenticacion de dos factores, control de acceso por roles y registro de actividad para maxima seguridad.",
    color: "amber",
  },
  {
    icon: <CalendarIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    title: "Calendario Integrado",
    description: "Programa citas, reuniones y eventos. Sincroniza con tu equipo y nunca pierdas una fecha importante.",
    color: "rose",
  },
  {
    icon: <EmailIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
    title: "Notificaciones",
    description: "Mantente al dia con alertas por email. Recordatorios automaticos para ti y tu equipo.",
    color: "cyan",
  },
];

// Tailwind needs full class names at build time — map color tokens to concrete classes.
const colorStyles: Record<string, { border: string; shadow: string; bg: string }> = {
  teal:   { border: "hover:border-teal-300 dark:hover:border-teal-700",     shadow: "hover:shadow-teal-500/5",   bg: "bg-teal-100 dark:bg-teal-900/30" },
  green:  { border: "hover:border-green-300 dark:hover:border-green-700",   shadow: "hover:shadow-green-500/5",  bg: "bg-green-100 dark:bg-green-900/30" },
  purple: { border: "hover:border-purple-300 dark:hover:border-purple-700", shadow: "hover:shadow-purple-500/5", bg: "bg-purple-100 dark:bg-purple-900/30" },
  amber:  { border: "hover:border-amber-300 dark:hover:border-amber-700",   shadow: "hover:shadow-amber-500/5",  bg: "bg-amber-100 dark:bg-amber-900/30" },
  rose:   { border: "hover:border-rose-300 dark:hover:border-rose-700",     shadow: "hover:shadow-rose-500/5",   bg: "bg-rose-100 dark:bg-rose-900/30" },
  cyan:   { border: "hover:border-cyan-300 dark:hover:border-cyan-700",     shadow: "hover:shadow-cyan-500/5",   bg: "bg-cyan-100 dark:bg-cyan-900/30" },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Banner */}
            <div className="flex items-center shrink-0">
              <CompanyBanner className="hidden sm:block h-10 w-auto max-w-[220px] rounded-lg shadow-md shadow-primary/20" />
              <div className="sm:hidden flex items-center gap-2.5">
                <CompanyLogo className="w-9 h-9 shadow-md shadow-primary/20" />
                <span className="text-xl font-bold text-foreground tracking-tight">SerTEC</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Plataforma de Gestion Profesional
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
              Gestiona tu equipo y clientes en{" "}
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">un solo lugar</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Optimiza las operaciones de tu negocio con nuestra plataforma integral.
              Administra clientes, coordina equipos y mejora la productividad.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Comenzar Ahora
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium border border-border text-foreground rounded-xl hover:bg-muted transition-all"
              >
                Ver Caracteristicas
              </Link>
            </div>
          </div>

          {/* Company Banner */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border">
              <CompanyBanner className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Todo lo que necesitas para gestionar tu negocio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas potentes y faciles de usar para equipos de todos los tamanos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const styles = colorStyles[feature.color];
              return (
                <div
                  key={feature.title}
                  className={`group p-6 bg-background rounded-2xl border border-border ${styles.border} hover:shadow-lg ${styles.shadow} transition-all`}
                >
                  <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
            Listo para optimizar tu negocio?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Unete a miles de empresas que ya confian en SerTEC para gestionar sus operaciones.
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3.5 text-base font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CompanyLogo className="w-7 h-7" />
            <span className="text-sm font-semibold text-foreground">SerTEC</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SerTEC. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
