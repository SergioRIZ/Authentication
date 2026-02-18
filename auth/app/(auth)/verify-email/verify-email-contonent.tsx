"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token no proporcionado");
      return;
    }

    verifyEmail();
  }, [token]);

  async function verifyEmail() {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("¡Tu email ha sido verificado correctamente!");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al verificar el email");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error de conexión");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white py-8 px-6 shadow rounded-lg text-center">
          {status === "loading" && (
            <>
              <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">Verificando tu email...</h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
              <p className="text-gray-600 mb-6">Ya puedes iniciar sesión en tu cuenta.</p>
              <Link
                href="/login"
                className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de verificación</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/resend-verification"
                  className="block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Solicitar nuevo enlace
                </Link>
                <Link
                  href="/login"
                  className="block text-teal-600 hover:text-teal-500"
                >
                  Volver al login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}