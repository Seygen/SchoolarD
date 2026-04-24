import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import StudentProfile from "@/components/students/StudentProfile"
import DeleteStudentButton from "@/components/students/DeleteStudentButton"

async function checkAccess(
  studentId: string,
  userId: string,
  schoolId: string,
  role: string
) {
  if (role === "ADMIN") return true

  if (role === "TEACHER") {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId,
        unenrolledAt: null,
        class: { schoolId, teachers: { some: { userId } } },
      },
    })
    return !!enrollment
  }

  if (role === "PARENT") {
    const link = await prisma.parentStudentLink.findFirst({
      where: { studentId, parentUserId: userId },
    })
    return !!link
  }

  return false
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params
  const schoolId = session.user.schoolId!
  const role = session.user.role

  const hasAccess = await checkAccess(id, session.user.id, schoolId, role)
  if (!hasAccess) notFound()

  const [student, currentYear] = await Promise.all([
    prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        contacts: { orderBy: { sortOrder: "asc" } },
        medical: true,
        observations: {
          include: {
            author: { select: { firstName: true, lastName: true } },
          },
          orderBy: { period: "desc" },
        },
        classEnrollments: {
          where: { unenrolledAt: null },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: true,
                teachers: {
                  where: { isPrimary: true },
                  include: {
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { label: true },
    }),
  ])

  if (!student) notFound()

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/eleves" className="text-sm text-gray-400 hover:text-gray-600">
          ← Annuaire
        </Link>
        {role === "ADMIN" && <DeleteStudentButton studentId={student.id} />}
      </div>

      <StudentProfile
        student={student as any}
        role={role}
        currentYearLabel={currentYear?.label ?? "2025-2026"}
      />
    </div>
  )
}
