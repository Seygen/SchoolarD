"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

type NavItem = { label: string; href: string; icon: string }

const adminNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard",        icon: "🏠" },
  { label: "Élèves",          href: "/eleves",            icon: "👥" },
  { label: "Classes",         href: "/classes",           icon: "🏫" },
  { label: "Équipe",          href: "/equipe",            icon: "👨‍🏫" },
  { label: "Import",          href: "/import",            icon: "📂" },
  { label: "Notifications",   href: "/notifications/new", icon: "🔔" },
  { label: "Réglages",        href: "/reglages",          icon: "⚙️" },
]

const teacherNav: NavItem[] = [
  { label: "Ma classe",     href: "/dashboard",  icon: "🏠" },
  { label: "Élèves",        href: "/eleves",     icon: "👥" },
  { label: "Publications",  href: "/publications", icon: "📣" },
  { label: "Documents",     href: "/documents",  icon: "📂" },
]

const parentNav: NavItem[] = [
  { label: "Actualités", href: "/dashboard",  icon: "🏠" },
  { label: "Documents",  href: "/documents",  icon: "📂" },
  { label: "Mon enfant", href: "/mon-enfant", icon: "👤" },
]

function getNav(role: string): NavItem[] {
  if (role === "ADMIN")   return adminNav
  if (role === "TEACHER") return teacherNav
  return parentNav
}

export default function Sidebar({
  role,
  schoolName,
  userName,
}: {
  role: string
  schoolName: string
  userName: string
}) {
  const pathname = usePathname()
  const nav = getNav(role)

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 uppercase tracking-wide">SchoolarD</p>
        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{schoolName}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 truncate mb-2">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
