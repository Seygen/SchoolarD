import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()

  if (!session) redirect("/login")

  if (session.user.role === "SUPER_ADMIN") {
    redirect(
      session.user.requiresTwoFactor
        ? "/superadmin/verify"
        : "/superadmin/dashboard"
    )
  }

  redirect("/dashboard")
}
