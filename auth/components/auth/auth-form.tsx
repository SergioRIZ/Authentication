interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthForm({ title, subtitle, children }: AuthFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}