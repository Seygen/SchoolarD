import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      schoolId: string | null
      schoolSlug: string | null
      requiresTwoFactor: boolean
    } & DefaultSession["user"]
  }
}
