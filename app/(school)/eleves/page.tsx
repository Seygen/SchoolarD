import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Prisma } from "@prisma/client"
import StudentFilters from "@/components/students/StudentFilters"
import { LEVEL_COLOR } from "@/lib/constants"

const PER_PAGE = 25

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; class?: string; page?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { q, level, class: classId, page = "1" } = await searchParams
  const schoolId = session.user.schoolId!
  const role = session.user.role
  const pageNum = Math.max(1, parseInt(page))
  const skip = (pageNum - 1) * PER_PAGE

  const nameFilter: Prisma.StudentWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {}

  const enrollmentFilter: Prisma.StudentWhereInput =
    role === "TEACHER"
      ? {
          classEnrollments: {
            some: {
              unenrolledAt: null,
              class: { schoolId, teachers: { some: { userId: session.user.id } } },
            },
          },
        }
      : classId
      ? { classEnrollments: { some: { classId, unenrolledAt: null } } }
      : {}

  const where: Prisma.StudentWhereInput = {
    schoolId,
    isActive: true,
    ...(level ? { level: level as any } : {}),
    ...nameFilter,
    ...enrollmentFilter,
  }

  const [students, total, classes] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        classEnrollments: {
          where: { unenrolledAt: null },
          include: { class: { select: { id: true, name: true } } },
          take: 1,
        },
        medical: { select: { paiProtocol: true, allergies: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: PER_PAGE,
    }),
    prisma.student.count({ where }),
    prisma.class.findMany({
      where: { schoolId, academicYear: { isCurrent: true } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (level) params.set("level", level)
    if (classId) params.set("class", classId)
    params.set("page", String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} élève{total !== 1 ? "s" : ""}
          </p>
        </div>
        {role === "ADMIN" && (
          <Link
            href="/eleves/nouveau"
            className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Ajouter un élève
          </Link>
        )}
      </div>

      {/* Filtres */}
      <StudentFilters
        classes={classes}
        defaultQ={q}
        defaultLevel={level}
        defaultClassId={classId}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 mt-4">
        {students.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            Aucun élève ne correspond à votre recherche.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Niveau</th>
                <th className="text-left px-4 py-3 font-medium">Classe</th>
                <th className="text-left px-4 py-3 font-medium">Signalements</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const enrollment = s.classEnrollments[0]
                const hasPai = !!s.medical?.paiProtocol
                const hasAllergy = !!s.medical?.allergies
                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {s.lastName} {s.firstName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[s.level]}`}
                      >
                        {s.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {enrollment?.class.name ?? (
                        <span className="text-amber-500 text-xs">⚠ Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {hasPai && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            PAI
                          </span>
                        )}
                        {hasAllergy && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            Allergie
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/eleves/${s.id}`}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-4">
          {pageNum > 1 && (
            <Link
              href={pageUrl(pageNum - 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              ←
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageUrl(p)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                p === pageNum
                  ? "bg-brand-600 text-white font-medium"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </Link>
          ))}
          {pageNum < totalPages && (
            <Link
              href={pageUrl(pageNum + 1)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
