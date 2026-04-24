import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { LEVEL_LABELS } from "@/lib/constants"

export default async function ClassesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const schoolId = session.user.schoolId!
  const role = session.user.role
  const userId = session.user.id

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true, label: true },
  })

  let classes
  if (role === "ADMIN") {
    classes = await prisma.class.findMany({
      where: { schoolId, ...(currentYear ? { academicYearId: currentYear.id } : {}) },
      include: {
        teachers: {
          where: { isPrimary: true },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        enrollments: { where: { unenrolledAt: null }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    })
  } else if (role === "TEACHER") {
    const assigned = await prisma.classTeacher.findMany({
      where: { userId, schoolId },
      select: { classId: true },
    })
    const classIds = assigned.map((a) => a.classId)
    classes = await prisma.class.findMany({
      where: { id: { in: classIds }, ...(currentYear ? { academicYearId: currentYear.id } : {}) },
      include: {
        teachers: {
          where: { isPrimary: true },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        enrollments: { where: { unenrolledAt: null }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    })
  } else if (role === "PARENT") {
    const links = await prisma.parentStudentLink.findMany({
      where: { parentUserId: userId, schoolId },
      select: { studentId: true },
    })
    const studentIds = links.map((l) => l.studentId)
    const enrollments = await prisma.classEnrollment.findMany({
      where: { studentId: { in: studentIds }, unenrolledAt: null },
      select: { classId: true },
    })
    const classIds = [...new Set(enrollments.map((e) => e.classId))]
    classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      include: {
        teachers: {
          where: { isPrimary: true },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        enrollments: { where: { unenrolledAt: null }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    })
  } else {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-500">
            {currentYear?.label ?? "—"} · {classes.length} classe(s)
          </p>
        </div>
        {role === "ADMIN" && (
          <Link
            href="/classes/composer"
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Composition des classes
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const teacher = cls.teachers[0]?.user
          const levelLabel = cls.level ? (LEVEL_LABELS[cls.level] ?? cls.level) : null
          return (
            <Link
              key={cls.id}
              href={`/classes/${cls.id}`}
              className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-800">{cls.name}</h2>
                {levelLabel && (
                  <span className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">
                    {levelLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {teacher
                  ? `${teacher.firstName} ${teacher.lastName}`
                  : "Aucun enseignant assigné"}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                {cls.enrollments.length} élève(s)
              </p>
            </Link>
          )
        })}
      </div>

      {classes.length === 0 && (
        <div className="text-center text-gray-400 py-16 text-sm">
          Aucune classe pour le moment.
        </div>
      )}
    </div>
  )
}
