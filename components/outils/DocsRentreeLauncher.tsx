"use client"

type Classe = {
  id: string
  name: string
  level: string | null
  year: string | null
  eleves: {
    prenom: string
    date: string
    sexe: string
    niveau: string | null
  }[]
}

type Props = { classes: Classe[] }

export default function DocsRentreeLauncher({ classes }: Props) {
  function openTool(cls?: Classe) {
    if (cls) {
      const payload = {
        classe: cls.name,
        annee: cls.year ?? "",
        eleves: cls.eleves.map((e) => ({
          prenom: e.prenom,
          date: e.date,
          sexe: e.sexe,
          niveau: e.niveau ?? cls.level ?? "",
        })),
      }
      sessionStorage.setItem("schoolardImport", JSON.stringify(payload))
      window.open("/tools/ma-classe.html?import=1", "_blank", "noopener")
    } else {
      window.open("/tools/ma-classe.html", "_blank", "noopener")
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Documents de rentrée maternelle</h2>
        <p className="text-sm text-gray-500 mb-4">
          Générateur d&apos;étiquettes, pyramide des âges, trombinoscope, pages de garde,
          groupes de travail et feuille de suivi. L&apos;outil fonctionne dans votre navigateur —
          vos données ne quittent pas l&apos;appareil.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 text-sm">
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">🏷️ Étiquettes</p>
            <p className="text-xs text-gray-500 mt-1">
              Présence, casiers, porte-manteaux — capitales, script, cursive
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">📊 Pyramide des âges</p>
            <p className="text-xs text-gray-500 mt-1">
              Colonnes Sept.→Août, tiers d&apos;âge colorés
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">👥 Trombinoscope</p>
            <p className="text-xs text-gray-500 mt-1">
              Classe, salle des maîtres, version cantine
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">📓 Pages de garde</p>
            <p className="text-xs text-gray-500 mt-1">
              Une par élève au thème de la classe
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">🎨 Groupes de travail</p>
            <p className="text-xs text-gray-500 mt-1">
              Alphabétique, équilibré, manuel, par niveau
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="font-semibold text-gray-700">📋 Feuille de suivi</p>
            <p className="text-xs text-gray-500 mt-1">
              Grille photocopiable pour ateliers
            </p>
          </div>
        </div>

        <button
          onClick={() => openTool()}
          className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Ouvrir l&apos;outil
        </button>
      </div>

      {classes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Pré-remplir avec une de vos classes</h2>
          <p className="text-sm text-gray-500 mb-4">
            Chargez directement la liste d&apos;une classe SchoolarD dans l&apos;outil.
            Prénoms, dates de naissance, sexes et niveaux sont importés (les
            noms de famille restent dans SchoolarD).
          </p>
          <div className="space-y-2">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{cls.name}</p>
                  <p className="text-xs text-gray-400">
                    {cls.eleves.length} élève(s)
                    {cls.level ? ` · ${cls.level}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => openTool(cls)}
                  disabled={cls.eleves.length === 0}
                  className="text-sm border border-brand-600 text-brand-600 rounded-lg px-4 py-1.5 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Ouvrir avec cette classe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
