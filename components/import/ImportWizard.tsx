"use client"

import { useState, useRef, useTransition } from "react"
import {
  parseImportFile,
  autoDetectMapping,
  validateRows,
  importStudents,
  type ParseResult,
  type ColumnMapping,
  type ValidationResult,
  type NormalizedStudent,
} from "@/app/(school)/import/actions"
import { LEVELS_ORDERED } from "@/lib/constants"

type Step = "upload" | "mapping" | "validation" | "done"

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ["firstName", "lastName", "level"]
const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  firstName:   "Prénom *",
  lastName:    "Nom *",
  level:       "Niveau *",
  dateOfBirth: "Date de naissance",
  gender:      "Genre",
}

export default function ImportWizard() {
  const [step, setStep] = useState<Step>("upload")
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [result, setResult] = useState<{ imported: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Step 1: Upload ──────────────────────────────────────────────────────────

  function handleFile(file: File) {
    const fd = new FormData()
    fd.append("file", file)
    startTransition(async () => {
      const result = await parseImportFile(fd)
      const detected = autoDetectMapping(result.headers)
      setParsed(result)
      setMapping(detected)
      setStep("mapping")
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── Step 2: Mapping ─────────────────────────────────────────────────────────

  function handleValidate() {
    const m = mapping as ColumnMapping
    startTransition(async () => {
      const result = await validateRows(parsed!.rows, m)
      setValidation(result)
      setStep("validation")
    })
  }

  const mappingComplete = REQUIRED_FIELDS.every((f) => mapping[f])

  // ── Step 3: Validation → Import ─────────────────────────────────────────────

  function handleImport(students: NormalizedStudent[]) {
    startTransition(async () => {
      const r = await importStudents(students)
      setResult(r)
      setStep("done")
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {(["upload", "mapping", "validation"] as Step[]).map((s, i) => {
          const labels: Record<string, string> = {
            upload:     "① Upload",
            mapping:    "② Mapping",
            validation: "③ Validation",
          }
          const done = ["upload","mapping","validation"].indexOf(step) > i
          const active = step === s
          return (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                active  ? "bg-brand-600 text-white" :
                done    ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-400"
              }`}
            >
              {done ? "✓ " : ""}{labels[s]}
            </span>
          )
        })}
      </div>

      {/* ── STEP 1 ── */}
      {step === "upload" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-brand-400 bg-brand-50" : "border-gray-200 hover:border-gray-300"
          } ${pending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm font-medium text-gray-700">
            {pending ? "Analyse en cours…" : "Glissez votre fichier ici ou cliquez pour parcourir"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Formats acceptés : .xlsx, .xls, .csv — 10 Mo max
          </p>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === "mapping" && parsed && (
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <p className="text-sm text-gray-500 mb-4">
              Fichier : <span className="font-medium text-gray-700">{parsed.total} lignes</span> détectées.
              Associez les colonnes de votre fichier aux champs SchoolarD.
            </p>
            <div className="space-y-3">
              {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map((field) => (
                <div key={field} className="flex items-center gap-4">
                  <label className="w-44 flex-shrink-0 text-sm text-gray-600">
                    {FIELD_LABELS[field]}
                  </label>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))
                    }
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— Non mappé</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
            <p className="text-xs font-medium text-gray-400 px-4 py-2 border-b border-gray-50 uppercase tracking-wide">
              Aperçu — 5 premières lignes
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50">
                    {parsed.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      {parsed.headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {row[h] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("upload")}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              ← Retour
            </button>
            <button
              onClick={handleValidate}
              disabled={!mappingComplete || pending}
              className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "Analyse…" : "Valider le mapping →"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === "validation" && validation && (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              value={validation.valid.length}
              label="Prêts à importer"
              color="text-green-600"
              bg="bg-green-50"
            />
            <StatCard
              value={validation.duplicates.length}
              label="Doublons (ignorés)"
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              value={validation.errors.length}
              label="Erreurs"
              color="text-red-600"
              bg="bg-red-50"
            />
          </div>

          {/* Erreurs */}
          {validation.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
              <p className="text-xs font-medium text-red-600 px-4 py-2 border-b border-red-50 bg-red-50">
                Erreurs — à corriger dans le fichier source
              </p>
              <ul className="divide-y divide-gray-50">
                {validation.errors.slice(0, 10).map((e, i) => (
                  <li key={i} className="px-4 py-2 text-sm text-gray-600">
                    Ligne {e.row} — {e.message}
                  </li>
                ))}
                {validation.errors.length > 10 && (
                  <li className="px-4 py-2 text-xs text-gray-400">
                    … et {validation.errors.length - 10} autre(s) erreur(s)
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Aperçu des lignes valides */}
          {validation.valid.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <p className="text-xs font-medium text-gray-400 px-4 py-2 border-b border-gray-50 uppercase tracking-wide">
                Élèves à importer ({validation.valid.length})
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    <th className="text-left px-4 py-2 font-medium">Nom</th>
                    <th className="text-left px-4 py-2 font-medium">Prénom</th>
                    <th className="text-left px-4 py-2 font-medium">Niveau</th>
                    <th className="text-left px-4 py-2 font-medium">Né(e) le</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.valid.slice(0, 8).map((s, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2 font-medium text-gray-800">{s.lastName}</td>
                      <td className="px-4 py-2 text-gray-600">{s.firstName}</td>
                      <td className="px-4 py-2">
                        <LevelBadge level={s.level} />
                      </td>
                      <td className="px-4 py-2 text-gray-400">{s.dateOfBirth}</td>
                    </tr>
                  ))}
                  {validation.valid.length > 8 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-xs text-gray-400">
                        … et {validation.valid.length - 8} autre(s) élève(s)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep("mapping")}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              ← Retour
            </button>
            <button
              onClick={() => handleImport(validation.valid)}
              disabled={validation.valid.length === 0 || pending}
              className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {pending
                ? "Import en cours…"
                : `Importer ${validation.valid.length} élève${validation.valid.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === "done" && result && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg font-semibold text-gray-900 mb-1">
            Import terminé
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {result.imported} élève{result.imported !== 1 ? "s" : ""} importé{result.imported !== 1 ? "s" : ""} avec succès.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/eleves"
              className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Voir l&apos;annuaire
            </a>
            <button
              onClick={() => {
                setStep("upload")
                setParsed(null)
                setMapping({})
                setValidation(null)
                setResult(null)
              }}
              className="text-sm text-gray-500 border border-gray-200 px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Nouvel import
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  value, label, color, bg,
}: {
  value: number; label: string; color: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function LevelBadge({ level }: { level: string }) {
  const maternelle = ["TPS","PS","MS","GS"]
  const elem1 = ["CP","CE1","CE2"]
  const color = maternelle.includes(level)
    ? "bg-purple-50 text-purple-700"
    : elem1.includes(level)
    ? "bg-blue-50 text-blue-700"
    : "bg-green-50 text-green-700"
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {level}
    </span>
  )
}
