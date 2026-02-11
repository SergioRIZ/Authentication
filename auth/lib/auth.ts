import NextAuth, { CredentialsSignin } from "next-auth"
import type { GoogleProfile } from "next-auth/providers/google"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { verifyTwoFactorCode } from "./two-factor"
import { logAuditEvent } from "./audit"
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCKOUT_DURATION_MS,
} from "./constants"

// Custom error classes for Auth.js
class TwoFactorRequiredError extends CredentialsSignin {
  code = "TWO_FACTOR_REQUIRED"
}

class TwoFactorInvalidError extends CredentialsSignin {
  code = "TWO_FACTOR_INVALID"
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED"
}

class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED"
}

// In-memory cache for user roles to avoid DB query on every JWT callback
const roleCache = new Map<string, { role: string; expiresAt: number }>()
const ROLE_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedRole(email: string): string | null {
  const entry = roleCache.get(email)
  if (!entry || Date.now() > entry.expiresAt) {
    roleCache.delete(email)
    return null
  }
  return entry.role
}

function setCachedRole(email: string, role: string): void {
  roleCache.set(email, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS })
}

/** Invalidate the cached role for a user (call after role changes). */
export function invalidateRoleCache(email: string): void {
  roleCache.delete(email)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim()

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
            emailVerified: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        }) as any

        if (!user || !user.password) {
          return null
        }

        // Check account lockout
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          await logAuditEvent({
            userId: user.id,
            action: "LOGIN_BLOCKED_LOCKOUT",
            details: `Cuenta bloqueada hasta ${new Date(user.lockedUntil).toISOString()}`,
          })
          throw new AccountLockedError()
        }

        // If account was locked but lockout has expired, unlock it
        if (user.lockedUntil && new Date(user.lockedUntil) <= new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null } as any,
          })
          await logAuditEvent({
            userId: user.id,
            action: "ACCOUNT_UNLOCKED",
            details: "Desbloqueo automático por expiración del período de bloqueo",
          })
        }

        // Verify email
        if (!user.emailVerified) {
          throw new EmailNotVerifiedError()
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          // Increment failed attempts
          const newAttempts = (user.failedLoginAttempts || 0) + 1
          const updateData: any = { failedLoginAttempts: newAttempts }

          if (newAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION_MS)
            await logAuditEvent({
              userId: user.id,
              action: "ACCOUNT_LOCKED",
              details: `Cuenta bloqueada tras ${newAttempts} intentos fallidos`,
            })
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          await logAuditEvent({
            userId: user.id,
            action: "LOGIN_FAILED",
            details: `Contraseña incorrecta (intento ${newAttempts}/${MAX_FAILED_LOGIN_ATTEMPTS})`,
          })

          return null
        }

        // Check 2FA
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const totpCode = credentials.totpCode as string | undefined

          if (!totpCode) {
            throw new TwoFactorRequiredError()
          }

          const isValidTotp = verifyTwoFactorCode(user.twoFactorSecret, totpCode)
          if (!isValidTotp) {
            await logAuditEvent({
              userId: user.id,
              action: "TWO_FACTOR_FAILED",
              details: "Código 2FA incorrecto durante el inicio de sesión",
            })
            throw new TwoFactorInvalidError()
          }
        }

        // Successful login — reset failed attempts
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null } as any,
          })
        }

        await logAuditEvent({
          userId: user.id,
          action: "LOGIN_SUCCESS",
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const googleProfile = profile as GoogleProfile
        const normalizedEmail = profile.email.toLowerCase().trim()

        let userId: string | undefined

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        })

        if (!user) {
          const newUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: profile.name || null,
              image: googleProfile.picture || null,
              emailVerified: new Date(),
              role: "USER",
            }
          })
          userId = newUser.id
          await logAuditEvent({
            userId: newUser.id,
            action: "REGISTER",
            details: "Registro mediante Google OAuth",
          })
        } else {
          userId = user.id
          if (!user.emailVerified) {
            await prisma.user.update({
              where: { email: normalizedEmail },
              data: { emailVerified: new Date() }
            })
          }
        }

        await logAuditEvent({
          userId,
          action: "LOGIN_SUCCESS",
          details: "Inicio de sesión con Google",
        })
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      // Refresh role from DB (cached with short TTL)
      if (token.email) {
        const email = token.email as string
        const cached = getCachedRole(email)
        if (cached) {
          token.role = cached
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { role: true }
          })
          if (dbUser) {
            token.role = dbUser.role
            setCachedRole(email, dbUser.role)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
