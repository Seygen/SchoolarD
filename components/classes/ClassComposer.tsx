"use client"

import { useState, useTransition } from "react"
import * as XLSX from "xlsx"
import { LEVEL_COLOR, LEVELS_ORDERED } from "@/lib/constants"
import { saveComposition, createClass, assignTeacher, deleteClass } from "@/app/(school)/classes/actions"

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentCard = {
  id: string
  firstName: string
  lastName: string
  level: string
  gender: string | null
}

type ClassSlot = {
  id: string
  name: string
  level: string | null
  maxStudents: number
  teacherId: string | null
  teacherName: string | null
}

type Teacher = { id: string; firstName: string; lastName: string }

// ── Auto-distribute ───────────────────────────────────────────────────────────

function autoDistributeAlgo(
  students: StudentCard[],
  classes: ClassSlot[]
): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  students.forEach((s) => { result[s.id] = null })

  if (!classes.length) return result

  // Compteurs de places occupées (on part de 0, répartition depuis zéro)
  const counts: Record<string, number> = {}
  classes.forEach((c) => { counts[c.id] = 0 })

  // Regroupe et trie les élèves par niveau en alternant F/M
  const byLevel: Record<string, StudentCard[]> = {}
  LEVELS_ORDERED.forEach((l) => { byLevel[l] = [] })
  students.forEach((s) => { if (byLevel[s.level]) byLevel[s.level].push(s) })

  for (const level of LEVELS_ORDERED) {
    const levelStudents = byLevel[level]
    if (!levelStudents.length) continue

    // Classes acceptant ce niveau : niveau identique OU aucun niveau fixé
    const eligible = classes.filter((c) => c.level === level || !c.level)
    if (!eligible.length) continue // pas de classe pour ce niveau → laisse non assigné

    // Tri M/F alternés
    const girls = levelStudents.filter((s) => s.gender === "F")
    const boys  = levelStudents.filter((s) => s.gender === "M")
    const other = levelStudents.filter((s) => s.gender !== "F" && s.gender !== "M")
    const sorted: StudentCard[] = []
    const max = Math.max(girls.length, boys.length)
    for (let i = 0; i < max; i++) {
      if (girls[i]) sorted.push(girls[i])
      if (boys[i])  sorted.push(boys[i])
    }
    sorted.push(...other)

    // Round-robin sur les classes éligibles, dans la limite de maxStudents
    let idx = 0
    for (const student of sorted) {
      let placed = false
      for (let attempt = 0; attempt < eligible.length; attempt++) {
        const cls = eligible[(idx + attempt) % eligible.length]
        if (counts[cls.id] < cls.maxStudents) {
          result[student.id] = cls.id
          counts[cls.id]++
          idx = (idx + attempt + 1) % eligible.length
          placed = true
          break
        }
      }
      if (!placed) result[student.id] = null // toutes les classes pleines → non assigné
    }
  }

  return result
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClassComposer({
  classes: initialClasses,
  students,
  teachers,
  initialAssignments,
}: {
  classes: ClassSlot[]
  students: StudentCard[]
  teachers: Teacher[]
  initialAssignments: Record<string, string | null>
}) {
  const [classes, setClasses] = useState(initialClasses)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [pending, startTransition] = useTransition()

  // Derive unassigned and per-class lists
  const unassigned = students.filter((s) => assignments[s.id] === null)
  const studentsInClass = (classId: string) =>
    students.filter((s) => assignments[s.id] === classId)

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  function onDragStart(studentId: string) {
    setDragging(studentId)
    setSaved(false)
  }

  function onDrop(targetClassId: string | null) {
    if (!dragging) return
    setAssignments((prev) => ({ ...prev, [dragging]: targetClassId }))
    setDragging(null)
    setDragTarget(null)
  }

  function dropZoneProps(targetClassId: string | null) {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragTarget(targetClassId) },
      onDragLeave: () => setDragTarget(null),
      onDrop: (e: React.DragEvent) => { e.preventDefault(); onDrop(targetClassId) },
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleAutoDistribute() {
    const result = autoDistributeAlgo(students, classes)
    setAssignments(result)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await saveComposition(assignments)
      setSaved(true)
    })
  }

  function handleAssignTeacher(classId: string, userId: string) {
    startTransition(() => assignTeacher(classId, userId))
  }

  function handleDeleteClass(classId: string) {
    startTransition(async () => {
      await deleteClass(classId)
      setClasses((prev) => prev.filter((c) => c.id !== classId))
      setAssignments((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((sid) => { if (next[sid] === classId) next[sid] = null })
        return next
      })
    })
  }

  // ── Export Excel ─────────────────────────────────────────────────────────────

  function handleExport() {
    const wb = XLSX.utils.book_new()
    const classMap = new Map(classes.map((c) => [c.id, c]))

    // Feuille "Récapitulatif" — tous les élèves triés par classe puis par nom
    const recap = [...students]
      .sort((a, b) => {
        const ca = assignments[a.id] ?? "￿"
        const cb = assignments[b.id] ?? "￿"
        if (ca !== cb) return ca.localeCompare(cb)
        return a.lastName.localeCompare(b.lastName)
      })
      .map((s) => {
        const cls = assignments[s.id] ? classMap.get(assignments[s.id]!) : null
        return {
          Classe: cls?.name ?? "Non assigné",
          "Niveau classe": cls?.level ?? "",
          Enseignant: cls?.teacherName ?? "",
          Nom: s.lastName,
          Prénom: s.firstName,
          Niveau: s.level,
          Sexe: s.gender === "F" ? "F" : s.gender === "M" ? "M" : "",
        }
      })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recap), "Récapitulatif")

    // Une feuille par classe
    for (const cls of classes) {
      const rows = students
        .filter((s) => assignments[s.id] === cls.id)
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((s, i) => ({
          "#": i + 1,
          Nom: s.lastName,
          Prénom: s.firstName,
          Niveau: s.level,
          Sexe: s.gender === "F" ? "F" : s.gender === "M" ? "M" : "",
        }))
      const sheetName = cls.name.slice(0, 31)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName)
    }

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([buf], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "composition-classes.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalAssigned = students.filter((s) => assignments[s.id] !== null).length

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={handleAutoDistribute}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ⚡ Répartir automatiquement
        </button>
        <button
          onClick={() => setShowNewClass(true)}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          + Nouvelle classe
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          📥 Exporter Excel
        </button>
        <div className="flex-1" />
        <span className="text-sm text-gray-400">
          {totalAssigned}/{students.length} élèves assignés
        </span>
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {pending ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
        </button>
      </div>

      {/* Formulaire nouvelle classe */}
      {showNewClass && (
        <NewClassForm
          onClose={() => setShowNewClass(false)}
          onCreated={(cls) => setClasses((prev) => [...prev, cls])}
        />
      )}

      {/* Grille : classes + non assignés */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const classStudents = studentsInClass(cls.id)
          const isOver = dragTarget === cls.id
          const isFull = classStudents.length >= cls.maxStudents

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-xl border-2 transition-colors ${
                isOver ? "border-brand-400 bg-brand-50" : "border-gray-100"
              }`}
              {...dropZoneProps(cls.id)}
            >
              {/* En-tête de classe */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-gray-800 text-sm">{cls.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${isFull ? "text-red-500" : "text-gray-400"}`}>
                      {classStudents.length}/{cls.maxStudents}
                    </span>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      disabled={pending}
                      title="Supprimer la classe"
                      className="text-gray-300 hover:text-red-400 text-xs leading-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Sélecteur enseignant */}
                <select
                  defaultValue={cls.teacherId ?? ""}
                  onChange={(e) => handleAssignTeacher(cls.id, e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-gray-100 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">— Aucun enseignant</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liste des élèves */}
              <div className="px-3 pb-3 min-h-20 flex flex-wrap gap-1.5">
                {classStudents.map((s) => (
                  <StudentChip
                    key={s.id}
                    student={s}
                    onDragStart={() => onDragStart(s.id)}
                  />
                ))}
                {classStudents.length === 0 && (
                  <p className="text-xs text-gray-300 w-full text-center py-3">
                    Glissez des élèves ici
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Colonne non assignés */}
        <div
          className={`bg-white rounded-xl border-2 transition-colors ${
            dragTarget === null && dragging ? "border-amber-400 bg-amber-50" : "border-dashed border-gray-200"
          }`}
          {...dropZoneProps(null)}
        >
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="font-semibold text-gray-600 text-sm">Non assignés</h2>
            <span className="text-xs text-amber-500 font-medium">{unassigned.length}</span>
          </div>
          <div className="px-3 pb-3 min-h-20 flex flex-wrap gap-1.5">
            {unassigned.map((s) => (
              <StudentChip
                key={s.id}
                student={s}
                onDragStart={() => onDragStart(s.id)}
                muted
              />
            ))}
            {unassigned.length === 0 && (
              <p className="text-xs text-gray-300 w-full text-center py-3">
                Tous les élèves sont assignés ✓
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Student chip ──────────────────────────────────────────────────────────────

function StudentChip({
  student,
  onDragStart,
  muted = false,
}: {
  student: StudentCard
  onDragStart: () => void
  muted?: boolean
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-grab active:cursor-grabbing select-none transition-opacity ${
        muted
          ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
      }`}
      title={`${student.lastName} ${student.firstName} — ${student.level}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        student.gender === "F" ? "bg-pink-400" :
        student.gender === "M" ? "bg-blue-400" : "bg-gray-300"
      }`} />
      <span className="max-w-24 truncate">
        {student.lastName} {student.firstName}
      </span>
      <span className={`text-[10px] px-1 rounded ${LEVEL_COLOR[student.level] ?? "bg-gray-50 text-gray-500"}`}>
        {student.level}
      </span>
    </div>
  )
}

// ── Nouvelle classe ───────────────────────────────────────────────────────────

function NewClassForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (cls: ClassSlot) => void
}) {
  const [name, setName] = useState("")
  const [level, setLevel] = useState("")
  const [maxStudents, setMaxStudents] = useState(25)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const newClass = await createClass(name, level, maxStudents)
      onCreated(newClass)
      onClose()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end"
    >
      <div>
        <label className="block text-xs text-gray-500 mb-1">Nom de la classe *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex : CE1-A"
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-36"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Niveau</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">—</option>
          {LEVELS_ORDERED.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Max élèves</label>
        <input
          type="number"
          min={1}
          max={40}
          value={maxStudents}
          onChange={(e) => setMaxStudents(parseInt(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Création…" : "Créer"}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="text-sm text-gray-400 hover:text-gray-600 px-2 py-2"
      >
        Annuler
      </button>
    </form>
  )
}
