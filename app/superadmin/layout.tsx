import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/auth"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900">SchoolarD</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Back-office</span>
          <nav className="flex gap-4">
            <Link href="/superadmin/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/superadmin/schools" className="text-sm text-gray-600 hover:text-gray-900">
              Établissements
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user.name}</span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
