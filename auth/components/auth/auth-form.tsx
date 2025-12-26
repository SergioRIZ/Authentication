import Link from "next/link";

interface AuthFormProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthForm({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {children}
        </div>

        <p className="text-center text-sm text-gray-600">
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}