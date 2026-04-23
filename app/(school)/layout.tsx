import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Sidebar from "@/components/layout/Sidebar"

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) redirect("/login")
  if (session.user.role === "SUPER_ADMIN") redirect("/superadmin/dashboard")

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId! },
    select: { name: true },
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role={session.user.role}
        schoolName={school?.name ?? ""}
        userName={session.user.name ?? session.user.email ?? ""}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
