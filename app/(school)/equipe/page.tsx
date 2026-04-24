import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import TeamManager from "@/components/equipe/TeamManager"

export default async function EquipePage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const schoolId = session.user.schoolId!

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true },
  })

  const [rawTeachers, rawStaff, classes] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId, role: { in: ["TEACHER", "ADMIN"] }, isActive: true },
      include: {
        classTeachers: {
          where: { isPrimary: true },
          include: { class: { select: { id: true, name: true } } },
          take: 1,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.staffMember.findMany({
      where: { schoolId, isActive: true },
      include: {
        classStaff: {
          include: { class: { select: { id: true, name: true } } },
          take: 1,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.class.findMany({
      where: {
        schoolId,
        ...(currentYear ? { academicYearId: currentYear.id } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const teachers = rawTeachers.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    classId: u.classTeachers[0]?.class.id ?? null,
    className: u.classTeachers[0]?.class.name ?? null,
  }))

  const staff = rawStaff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    staffType: s.staffType,
    email: s.email,
    phone: s.phone,
    classId: s.classStaff[0]?.class.id ?? null,
    className: s.classStaff[0]?.class.name ?? null,
  }))

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Équipe pédagogique</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {teachers.length} enseignant(s) · {staff.length} personnel(s)
        </p>
      </div>
      <TeamManager teachers={teachers} staff={staff} classes={classes} />
    </div>
  )
}
