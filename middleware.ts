import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthenticated = !!session

  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  // Redirection si déjà connecté
  if (pathname === "/login") {
    if (isAuthenticated && !session.user.requiresTwoFactor) {
      const dest =
        session.user.role === "SUPER_ADMIN"
          ? "/superadmin/dashboard"
          : "/dashboard"
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // Vérification 2FA super admin
  if (pathname === "/superadmin/verify") {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/login", req.url))
    return NextResponse.next()
  }

  // Routes super admin
  if (pathname.startsWith("/superadmin")) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/login", req.url))
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (session.user.requiresTwoFactor) {
      return NextResponse.redirect(new URL("/superadmin/verify", req.url))
    }
    return NextResponse.next()
  }

  // Toutes les autres routes nécessitent une session
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Bloquer les super admins sans 2FA validé sur les routes école
  if (session.user.requiresTwoFactor) {
    return NextResponse.redirect(new URL("/superadmin/verify", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
