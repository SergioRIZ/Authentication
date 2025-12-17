'use client'
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AuthForm from "./auth-form"
import Input from "../ui/input"
import Button from "../ui/buttons"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"

export default function RegisterForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true)
        setError("")
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            const result = await response.json()
            if (!response.ok) {
                setError(result.message || "Registration failed. Please try again.")
                setIsLoading(false)
                return
            }
            const loginResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })
            if (loginResult?.error) {
                setError("Registration succeeded but automatic login failed. Please try logging in manually.")
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }
    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        setError("")
        try {
            await signIn('google', { callbackUrl: '/dashboard' })
        } catch (err) {
            setError("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    return (
           <AuthForm 
      title="Registro" 
      subtitle="Introduce tus datos para crear una cuenta"
    >
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Formulario de registro */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          type="text"
          placeholder="Tu nombre"
          error={errors.name?.message}
          disabled={isLoading}
          {...register("name")}
        />

        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          error={errors.email?.message}
          disabled={isLoading}
          {...register("email")}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          error={errors.password?.message}
          disabled={isLoading}
          {...register("password")}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          Crear cuenta
        </Button>
      </form>

      {/* Link a login */}
      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link 
          href="/login" 
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthForm>
            )
}