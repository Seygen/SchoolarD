import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import NotificationForm from "@/components/notifications/NotificationForm"

export default async function NewNotificationPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const schoolId = session.user.schoolId!

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true },
  })

  let classes: { id: string; name: string }[] = []

  if (session.user.role === "ADMIN") {
    classes = await prisma.class.findMany({
      where: { schoolId, ...(currentYear ? { academicYearId: currentYear.id } : {}) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  } else {
    const assigned = await prisma.classTeacher.findMany({
      where: { userId: session.user.id, schoolId },
      include: { class: { select: { id: true, name: true } } },
    })
    classes = assigned.map((a) => ({ id: a.class.id, name: a.class.name }))
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Envoyer une notification</h1>
      <p className="text-sm text-gray-500 mb-6">
        Les parents connectés recevront cette notification dans leur espace.
      </p>
      <NotificationForm classes={classes} />
    </div>
  )
}
