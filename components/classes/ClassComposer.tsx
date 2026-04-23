"use client"

import { useState, useTransition } from "react"
import { LEVEL_COLOR, LEVELS_ORDERED } from "@/lib/constants"
import { saveComposition, createClass, assignTeacher } from "@/app/(school)/classes/actions"

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

  // Count how many each class currently has (all start at 0)
  const counts: Record<string, number> = {}
  classes.forEach((c) => { counts[c.id] = 0 })

  // Sort students: alternate M/F within each level
  const byLevel: Record<string, StudentCard[]> = {}
  LEVELS_ORDERED.forEach((l) => { byLevel[l] = [] })
  students.forEach((s) => {
    if (byLevel[s.level]) byLevel[s.level].push(s)
  })

  const sorted: StudentCard[] = []
  for (const level of LEVELS_ORDERED) {
    const girls = byLevel[level].filter((s) => s.gender === "F")
    const boys = byLevel[level].filter((s) => s.gender === "M")
    const other = byLevel[level].filter((s) => s.gender !== "F" && s.gender !== "M")
    const max = Math.max(girls.length, boys.length)
    for (let i = 0; i < max; i++) {
      if (girls[i]) sorted.push(girls[i])
      if (boys[i]) sorted.push(boys[i])
    }
    sorted.push(...other)
  }

  // Round-robin, respecting maxStudents
  let idx = 0
  for (const student of sorted) {
    let placed = false
    for (let attempt = 0; attempt < classes.length; attempt++) {
      const cls = classes[(idx + attempt) % classes.length]
      if (counts[cls.id] < cls.maxStudents) {
        result[student.id] = cls.id
        counts[cls.id]++
        idx = (idx + attempt + 1) % classes.length
        placed = true
        break
      }
    }
    if (!placed) result[student.id] = null // overflow → unassigned
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
    const result = autoDistributeAlgo(students, initialClasses)
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
        />
      )}

      {/* Grille : classes + non assignés */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {initialClasses.map((cls) => {
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
                  <span className={`text-xs font-medium ${isFull ? "text-red-500" : "text-gray-400"}`}>
                    {classStudents.length}/{cls.maxStudents}
                  </span>
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

function NewClassForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [level, setLevel] = useState("")
  const [maxStudents, setMaxStudents] = useState(25)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createClass(name, level, maxStudents)
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
