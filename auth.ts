import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        // Vérification dans les comptes école (admin, enseignant, parent)
        const user = await prisma.user.findFirst({
          where: { email, isActive: true },
          include: {
            school: { select: { slug: true, status: true } },
          },
        })

        if (user?.passwordHash && user.school.status === "ACTIVE") {
          const valid = await bcrypt.compare(password, user.passwordHash)
          if (valid) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role as string,
              schoolId: user.schoolId,
              schoolSlug: user.school.slug,
              requiresTwoFactor: false,
            }
          }
        }

        // Vérification dans les super admins (TOTP requis après cette étape)
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email, isActive: true },
        })

        if (superAdmin?.passwordHash) {
          const valid = await bcrypt.compare(password, superAdmin.passwordHash)
          if (valid) {
            return {
              id: superAdmin.id,
              email: superAdmin.email,
              name: superAdmin.fullName,
              role: "SUPER_ADMIN",
              schoolId: null,
              schoolSlug: null,
              requiresTwoFactor: true,
            }
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.schoolId = (user as any).schoolId ?? null
        token.schoolSlug = (user as any).schoolSlug ?? null
        token.requiresTwoFactor = (user as any).requiresTwoFactor ?? false
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.schoolId = token.schoolId as string | null
      session.user.schoolSlug = token.schoolSlug as string | null
      session.user.requiresTwoFactor = token.requiresTwoFactor as boolean
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
