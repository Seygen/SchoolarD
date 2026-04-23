import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import ClassComposer from "@/components/classes/ClassComposer"

export default async function ComposerPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const schoolId = session.user.schoolId!

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true, label: true },
  })

  const [classes, allStudents, teachers] = await Promise.all([
    prisma.class.findMany({
      where: {
        schoolId,
        ...(currentYear ? { academicYearId: currentYear.id } : {}),
      },
      include: {
        enrollments: {
          where: { unenrolledAt: null },
          select: { studentId: true },
        },
        teachers: {
          where: { isPrimary: true },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, firstName: true, lastName: true, level: true, gender: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.user.findMany({
      where: { schoolId, role: { in: ["ADMIN", "TEACHER"] }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }],
    }),
  ])

  // Construire la map studentId → classId depuis les inscriptions actuelles
  const initialAssignments: Record<string, string | null> = {}
  allStudents.forEach((s) => { initialAssignments[s.id] = null })
  classes.forEach((c) => {
    c.enrollments.forEach(({ studentId }) => {
      initialAssignments[studentId] = c.id
    })
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Composition des classes</h1>
          <p className="text-sm text-gray-500">
            Année {currentYear?.label ?? "—"} · {allStudents.length} élèves · {classes.length} classes
          </p>
        </div>
      </div>

      <ClassComposer
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          maxStudents: c.maxStudents,
          teacherId: c.teachers[0]?.user.id ?? null,
          teacherName: c.teachers[0]
            ? `${c.teachers[0].user.firstName} ${c.teachers[0].user.lastName}`
            : null,
        }))}
        students={allStudents.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          level: s.level,
          gender: s.gender,
        }))}
        teachers={teachers}
        initialAssignments={initialAssignments}
      />
    </div>
  )
}
