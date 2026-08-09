import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import DocsRentreeLauncher from "@/components/outils/DocsRentreeLauncher"

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default async function OutilsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard")
  }

  const schoolId = session.user.schoolId!
  const userId = session.user.id
  const role = session.user.role

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true, label: true },
  })

  const classFilter = {
    schoolId,
    ...(currentYear ? { academicYearId: currentYear.id } : {}),
    ...(role === "TEACHER"
      ? { teachers: { some: { userId } } }
      : {}),
  }

  const rawClasses = await prisma.class.findMany({
    where: classFilter,
    include: {
      enrollments: {
        where: { unenrolledAt: null },
        include: {
          student: {
            select: {
              firstName: true,
              dateOfBirth: true,
              gender: true,
              level: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const classes = rawClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    level: cls.level,
    year: currentYear?.label ?? null,
    eleves: cls.enrollments.map((e) => ({
      prenom: e.student.firstName,
      date: toIsoDate(e.student.dateOfBirth),
      sexe: e.student.gender === "M" ? "M" : "F",
      niveau: e.student.level,
    })),
  }))

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Outils imprimables</h1>
      <p className="text-sm text-gray-500 mb-6">
        Générateurs de documents pour la classe. Les données restent sur votre appareil.
      </p>
      <DocsRentreeLauncher classes={classes} />
    </div>
  )
}
