import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const schoolId = session.user.schoolId!
  const role = session.user.role

  if (role === "ADMIN") return <AdminDashboard schoolId={schoolId} />
  if (role === "TEACHER") return <TeacherDashboard userId={session.user.id} schoolId={schoolId} />
  return <ParentDashboard userId={session.user.id} schoolId={schoolId} />
}

async function AdminDashboard({ schoolId }: { schoolId: string }) {
  const [studentCount, classCount, userCount, currentYear] = await Promise.all([
    prisma.student.count({ where: { schoolId, isActive: true } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.user.count({ where: { schoolId, role: "TEACHER", isActive: true } }),
    prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { label: true },
    }),
  ])

  const classesWithAlerts = await prisma.class.findMany({
    where: { schoolId, academicYear: { isCurrent: true } },
    include: {
      teachers: { where: { isPrimary: true } },
      enrollments: { where: { unenrolledAt: null } },
    },
    orderBy: { name: "asc" },
  })

  const alerts = classesWithAlerts.filter((c) => c.teachers.length === 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Année scolaire {currentYear?.label ?? "—"}</p>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Élèves inscrits", value: studentCount },
          { label: "Classes",         value: classCount },
          { label: "Enseignants",     value: userCount },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            <p className="text-sm text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Alertes</p>
          <ul className="space-y-1">
            {alerts.map((c) => (
              <li key={c.id} className="text-sm text-amber-700">
                Classe {c.name} — aucun enseignant affecté
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Classes */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Classes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-50">
              <th className="text-left px-4 py-2 font-medium">Classe</th>
              <th className="text-left px-4 py-2 font-medium">Niveau</th>
              <th className="text-left px-4 py-2 font-medium">Effectif</th>
            </tr>
          </thead>
          <tbody>
            {classesWithAlerts.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.level ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {c.enrollments.length}/{c.maxStudents}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function TeacherDashboard({ userId, schoolId }: { userId: string; schoolId: string }) {
  const myClasses = await prisma.class.findMany({
    where: {
      schoolId,
      teachers: { some: { userId } },
      academicYear: { isCurrent: true },
    },
    include: {
      enrollments: { where: { unenrolledAt: null } },
      posts: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 3 },
    },
  })

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Ma classe</h1>
      {myClasses.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">{c.name}</h2>
            <span className="text-xs text-gray-400">{c.enrollments.length} élèves</span>
          </div>
          <div className="space-y-2">
            {c.posts.map((p) => (
              <div key={p.id} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                {p.content.slice(0, 100)}{p.content.length > 100 ? "…" : ""}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

async function ParentDashboard({ userId, schoolId }: { userId: string; schoolId: string }) {
  const links = await prisma.parentStudentLink.findMany({
    where: { parentUserId: userId, schoolId },
    include: {
      student: {
        include: {
          classEnrollments: {
            where: { unenrolledAt: null },
            include: {
              class: {
                include: {
                  posts: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: { attachments: true, author: { select: { firstName: true, lastName: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return (
    <div className="p-4 max-w-xl">
      {links.map(({ student }) => {
        const enrollment = student.classEnrollments[0]
        const posts = enrollment?.class.posts ?? []
        return (
          <div key={student.id}>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-gray-400 mb-4">
              {enrollment?.class.name ?? "Aucune classe assignée"}
            </p>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      {post.author.firstName} {post.author.lastName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{post.content}</p>
                  {post.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {post.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-brand-600 hover:underline"
                        >
                          📎 {a.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  Aucune publication pour le moment.
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
