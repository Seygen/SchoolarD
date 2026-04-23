import { prisma } from "@/lib/db"
import Link from "next/link"

export default async function SuperAdminDashboardPage() {
  const [schoolCount, studentCount, schools] = await Promise.all([
    prisma.school.count({ where: { status: "ACTIVE" } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.school.findMany({
      where: { status: { not: "DELETED" } },
      include: {
        _count: { select: { students: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const statusLabel: Record<string, string> = {
    ACTIVE:    "Actif",
    SUSPENDED: "Suspendu",
    DELETED:   "Supprimé",
  }

  const statusColor: Record<string, string> = {
    ACTIVE:    "text-green-600 bg-green-50",
    SUSPENDED: "text-amber-600 bg-amber-50",
    DELETED:   "text-red-600 bg-red-50",
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord plateforme</h1>
        <Link
          href="/superadmin/schools/new"
          className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          + Nouvel établissement
        </Link>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">{schoolCount}</p>
          <p className="text-sm text-gray-500 mt-1">Établissements actifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-900">{studentCount.toLocaleString("fr-FR")}</p>
          <p className="text-sm text-gray-500 mt-1">Élèves au total</p>
        </div>
      </div>

      {/* Liste des établissements */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Établissements</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-50">
              <th className="text-left px-4 py-2 font-medium">Nom</th>
              <th className="text-left px-4 py-2 font-medium">Pays</th>
              <th className="text-left px-4 py-2 font-medium">Statut</th>
              <th className="text-right px-4 py-2 font-medium">Élèves</th>
              <th className="text-right px-4 py-2 font-medium">Utilisateurs</th>
              <th className="text-left px-4 py-2 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{s.country}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-500">{s._count.students}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{s._count.users}</td>
                <td className="px-4 py-2.5 text-gray-400">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
