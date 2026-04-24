"use client"

import { useState, useTransition } from "react"
import {
  createTeacher, deleteTeacher,
  createStaffMember, deleteStaffMember,
  assignTeacherToClass, assignStaffToClass,
} from "@/app/(school)/equipe/actions"

type ClassOption = { id: string; name: string }

type Teacher = {
  id: string
  firstName: string
  lastName: string
  email: string
  classId: string | null
  className: string | null
}

type Staff = {
  id: string
  firstName: string
  lastName: string
  staffType: string
  email: string | null
  phone: string | null
  classId: string | null
  className: string | null
}

type Props = {
  teachers: Teacher[]
  staff: Staff[]
  classes: ClassOption[]
}

const STAFF_TYPE_LABELS: Record<string, string> = {
  AESH: "AESH",
  AVS: "AVS",
  OTHER: "Autre",
}

const STAFF_TYPE_COLORS: Record<string, string> = {
  AESH: "bg-purple-50 text-purple-700",
  AVS: "bg-indigo-50 text-indigo-700",
  OTHER: "bg-gray-100 text-gray-600",
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

// ── Teacher card ──────────────────────────────────────────────────────────────

function TeacherCard({
  teacher,
  classes,
}: {
  teacher: Teacher
  classes: ClassOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleClassChange(classId: string) {
    startTransition(() => assignTeacherToClass(teacher.id, classId || null))
  }

  function handleDelete() {
    startTransition(() => deleteTeacher(teacher.id))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
        {initials(teacher.firstName, teacher.lastName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">
          {teacher.firstName} {teacher.lastName}
        </p>
        <p className="text-xs text-gray-400 truncate">{teacher.email}</p>
        <div className="mt-2">
          <select
            defaultValue={teacher.classId ?? ""}
            onChange={(e) => handleClassChange(e.target.value)}
            disabled={isPending}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-[220px]"
          >
            <option value="">— Aucune classe assignée</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="shrink-0">
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs bg-red-500 text-white rounded px-2 py-1"
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs border rounded px-2 py-1 text-gray-500"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-300 hover:text-red-400 text-xs"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({
  member,
  classes,
}: {
  member: Staff
  classes: ClassOption[]
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleClassChange(classId: string) {
    startTransition(() => assignStaffToClass(member.id, classId || null))
  }

  function handleDelete() {
    startTransition(() => deleteStaffMember(member.id))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold shrink-0">
        {initials(member.firstName, member.lastName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm">
            {member.firstName} {member.lastName}
          </p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAFF_TYPE_COLORS[member.staffType]}`}>
            {STAFF_TYPE_LABELS[member.staffType] ?? member.staffType}
          </span>
        </div>
        {(member.email || member.phone) && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {member.email ?? member.phone}
          </p>
        )}
        <div className="mt-2">
          <select
            defaultValue={member.classId ?? ""}
            onChange={(e) => handleClassChange(e.target.value)}
            disabled={isPending}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-[220px]"
          >
            <option value="">— Aucune classe assignée</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="shrink-0">
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs bg-red-500 text-white rounded px-2 py-1"
            >
              Confirmer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs border rounded px-2 py-1 text-gray-500"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-300 hover:text-red-400 text-xs"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

// ── New teacher form ──────────────────────────────────────────────────────────

function NewTeacherForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createTeacher(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-800">Nouvel enseignant</p>
      <div className="grid grid-cols-2 gap-3">
        <input name="firstName" required placeholder="Prénom *"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input name="lastName" required placeholder="Nom *"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input name="email" type="email" required placeholder="Email *"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input name="password" type="password" required placeholder="Mot de passe provisoire *"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">
          {isPending ? "Création…" : "Créer le compte"}
        </button>
        <button type="button" onClick={onClose}
          className="text-sm text-gray-500 px-3 py-2 hover:text-gray-700">
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── New staff form ────────────────────────────────────────────────────────────

function NewStaffForm({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createStaffMember(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-purple-800">Nouveau personnel</p>
      <div className="grid grid-cols-2 gap-3">
        <input name="firstName" required placeholder="Prénom *"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <input name="lastName" required placeholder="Nom *"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>
      <select name="staffType" defaultValue="AESH"
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
        <option value="AESH">AESH</option>
        <option value="AVS">AVS</option>
        <option value="OTHER">Autre</option>
      </select>
      <input name="email" type="email" placeholder="Email (optionnel)"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      <input name="phone" type="tel" placeholder="Téléphone (optionnel)"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">
          {isPending ? "Création…" : "Ajouter"}
        </button>
        <button type="button" onClick={onClose}
          className="text-sm text-gray-500 px-3 py-2 hover:text-gray-700">
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TeamManager({ teachers, staff, classes }: Props) {
  const [tab, setTab] = useState<"teachers" | "staff">("teachers")
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {(["teachers", "staff"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowForm(false) }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              tab === t ? "bg-white shadow-sm font-medium text-gray-800" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "teachers" ? `Enseignants (${teachers.length})` : `Personnel (${staff.length})`}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && tab === "teachers" && (
        <div className="mb-4">
          <NewTeacherForm onClose={() => setShowForm(false)} />
        </div>
      )}
      {showForm && tab === "staff" && (
        <div className="mb-4">
          <NewStaffForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 text-sm border border-dashed border-gray-300 rounded-xl px-4 py-2 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full"
        >
          + {tab === "teachers" ? "Ajouter un enseignant" : "Ajouter un membre du personnel"}
        </button>
      )}

      {/* List */}
      <div className="space-y-3">
        {tab === "teachers" && (
          <>
            {teachers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Aucun enseignant pour le moment.</p>
            )}
            {teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} classes={classes} />
            ))}
          </>
        )}
        {tab === "staff" && (
          <>
            {staff.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Aucun personnel pour le moment.</p>
            )}
            {staff.map((s) => (
              <StaffCard key={s.id} member={s} classes={classes} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
