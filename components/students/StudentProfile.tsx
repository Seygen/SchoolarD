"use client"

import { useState, useTransition } from "react"
import { LEVEL_COLOR, CONTACT_RELATIONSHIP_LABELS } from "@/lib/constants"
import {
  upsertObservation,
  upsertMedical,
  saveContact,
  deleteContact,
} from "@/app/(school)/eleves/actions"

// ── Types ─────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  firstName: string
  lastName: string
  relationship: string
  phone: string | null
  email: string | null
  isAuthorizedPickup: boolean
  isEmergencyContact: boolean
}

type Medical = {
  allergies: string | null
  treatments: string | null
  paiProtocol: string | null
  homeSupport: string | null
  otherNotes: string | null
} | null

type Observation = {
  id: string
  period: string
  content: string
  author: { firstName: string; lastName: string }
}

type Enrollment = {
  class: {
    id: string
    name: string
    level: string | null
    teachers: { user: { firstName: string; lastName: string } }[]
  }
}

type Student = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: string | null
  level: string
  photoUrl: string | null
  notes: string | null
  contacts: Contact[]
  medical: Medical
  observations: Observation[]
  classEnrollments: Enrollment[]
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = "contacts" | "medical" | "observations" | "documents"

export default function StudentProfile({
  student,
  role,
  currentYearLabel,
}: {
  student: Student
  role: string
  currentYearLabel: string
}) {
  const [tab, setTab] = useState<Tab>("contacts")
  const enrollment = student.classEnrollments[0]
  const canEdit = role === "ADMIN" || role === "TEACHER"
  const isAdmin = role === "ADMIN"

  const age = Math.floor(
    (Date.now() - new Date(student.dateOfBirth).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: "contacts",     label: "Contacts" },
    { key: "medical",      label: "Médical" },
    { key: "observations", label: "Observations" },
    { key: "documents",    label: "Documents" },
  ]

  return (
    <div>
      {/* En-tête élève */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
          {student.gender === "F" ? "👧" : student.gender === "M" ? "👦" : "🧒"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">
            {student.lastName} {student.firstName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[student.level]}`}
            >
              {student.level}
            </span>
            {enrollment ? (
              <span className="text-sm text-gray-500">{enrollment.class.name}</span>
            ) : (
              <span className="text-xs text-amber-500">⚠ Aucune classe</span>
            )}
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">{age} ans</span>
          </div>
          {enrollment?.class.teachers[0] && (
            <p className="text-xs text-gray-400 mt-1">
              Enseignant(e) :{" "}
              {enrollment.class.teachers[0].user.firstName}{" "}
              {enrollment.class.teachers[0].user.lastName}
            </p>
          )}
        </div>
        {student.medical?.paiProtocol && (
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium flex-shrink-0">
            PAI
          </span>
        )}
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "text-brand-700 border-b-2 border-brand-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "contacts" && (
            <ContactsTab
              studentId={student.id}
              contacts={student.contacts}
              canEdit={isAdmin}
            />
          )}
          {tab === "medical" && (
            <MedicalTab
              studentId={student.id}
              medical={student.medical}
              canEdit={canEdit}
            />
          )}
          {tab === "observations" && (
            <ObservationsTab
              studentId={student.id}
              observations={student.observations}
              canEdit={canEdit}
              currentYearLabel={currentYearLabel}
            />
          )}
          {tab === "documents" && (
            <DocumentsTab classId={enrollment?.class.id} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Contacts ───────────────────────────────────────────────────────────

function ContactsTab({
  studentId,
  contacts,
  canEdit,
}: {
  studentId: string
  contacts: Contact[]
  canEdit: boolean
}) {
  const [editing, setEditing] = useState<Contact | null | "new">(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Contacts & responsables légaux
        </h2>
        {canEdit && (
          <button
            onClick={() => setEditing("new")}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            + Ajouter
          </button>
        )}
      </div>

      {contacts.length === 0 && !editing && (
        <p className="text-sm text-gray-400 text-center py-6">
          Aucun contact enregistré.
        </p>
      )}

      <div className="space-y-3">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {c.firstName} {c.lastName}
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  {CONTACT_RELATIONSHIP_LABELS[c.relationship] ?? c.relationship}
                </span>
              </p>
              <div className="mt-1 space-y-0.5">
                {c.phone && (
                  <p className="text-xs text-gray-500">📞 {c.phone}</p>
                )}
                {c.email && (
                  <p className="text-xs text-gray-500">✉️ {c.email}</p>
                )}
              </div>
              <div className="flex gap-2 mt-1.5">
                {c.isAuthorizedPickup && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    Autorisé à récupérer
                  </span>
                )}
                {c.isEmergencyContact && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    Urgence
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditing(c)}
                  className="text-xs text-gray-400 hover:text-brand-600"
                >
                  Modifier
                </button>
                <DeleteContactButton
                  studentId={studentId}
                  contactId={c.id}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {editing !== null && (
        <ContactForm
          studentId={studentId}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function DeleteContactButton({
  studentId,
  contactId,
}: {
  studentId: string
  contactId: string
}) {
  const [, startTransition] = useTransition()
  return (
    <button
      onClick={() =>
        startTransition(() => deleteContact(studentId, contactId))
      }
      className="text-xs text-gray-400 hover:text-red-500"
    >
      Supprimer
    </button>
  )
}

function ContactForm({
  studentId,
  initial,
  onClose,
}: {
  studentId: string
  initial: Contact | null
  onClose: () => void
}) {
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    relationship: initial?.relationship ?? "MOTHER",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    isAuthorizedPickup: initial?.isAuthorizedPickup ?? false,
    isEmergencyContact: initial?.isEmergencyContact ?? false,
  })
  const [pending, startTransition] = useTransition()

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await saveContact(studentId, initial?.id ?? null, form)
      onClose()
    })
  }

  return (
    <div className="mt-4 border border-gray-100 rounded-xl p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {initial ? "Modifier le contact" : "Nouveau contact"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom *">
            <input
              required
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Nom *">
            <input
              required
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Lien de parenté">
          <select
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value)}
            className={inputCls}
          >
            {Object.entries(CONTACT_RELATIONSHIP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
              placeholder="06 …"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              placeholder="prenom@…"
            />
          </Field>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAuthorizedPickup}
              onChange={(e) => set("isAuthorizedPickup", e.target.checked)}
              className="rounded"
            />
            Autorisé(e) à récupérer l&apos;enfant
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isEmergencyContact}
              onChange={(e) => set("isEmergencyContact", e.target.checked)}
              className="rounded"
            />
            Contact d&apos;urgence
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Onglet Médical ────────────────────────────────────────────────────────────

function MedicalTab({
  studentId,
  medical,
  canEdit,
}: {
  studentId: string
  medical: Medical
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    allergies:   medical?.allergies   ?? "",
    treatments:  medical?.treatments  ?? "",
    paiProtocol: medical?.paiProtocol ?? "",
    homeSupport: medical?.homeSupport ?? "",
    otherNotes:  medical?.otherNotes  ?? "",
  })
  const [pending, startTransition] = useTransition()

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await upsertMedical(studentId, form)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Données médicales
        </h2>
        {[
          { key: "allergies",   label: "Allergies" },
          { key: "treatments",  label: "Traitements en cours" },
          { key: "paiProtocol", label: "Protocole PAI" },
          { key: "homeSupport", label: "Soutien à domicile (ortho, AESH…)" },
          { key: "otherNotes",  label: "Autres observations" },
        ].map(({ key, label }) => (
          <Field key={key} label={label}>
            <textarea
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="—"
            />
          </Field>
        ))}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-gray-500 px-3 py-1.5"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Données médicales</h2>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            Modifier
          </button>
        )}
      </div>

      {!medical ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Aucune donnée médicale enregistrée.
        </p>
      ) : (
        <dl className="space-y-3">
          {[
            { label: "Allergies",              value: medical.allergies },
            { label: "Traitements",            value: medical.treatments },
            { label: "Protocole PAI",          value: medical.paiProtocol },
            { label: "Soutien à domicile",     value: medical.homeSupport },
            { label: "Autres observations",    value: medical.otherNotes },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <dt className="w-44 flex-shrink-0 text-xs font-medium text-gray-400 pt-0.5">
                {label}
              </dt>
              <dd className="text-sm text-gray-700">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// ── Onglet Observations ───────────────────────────────────────────────────────

function ObservationsTab({
  studentId,
  observations,
  canEdit,
  currentYearLabel,
}: {
  studentId: string
  observations: Observation[]
  canEdit: boolean
  currentYearLabel: string
}) {
  const [showForm, setShowForm] = useState(false)
  const year = currentYearLabel.split("-")[0] ?? "2025"
  const periods = [`${year}-T1`, `${year}-T2`, `${year}-T3`]

  const [form, setForm] = useState({ period: periods[0], content: "" })
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) return
    startTransition(async () => {
      await upsertObservation(studentId, form.period, form.content)
      setShowForm(false)
      setForm((f) => ({ ...f, content: "" }))
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Observations pédagogiques
        </h2>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            + Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3"
        >
          <Field label="Période">
            <select
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              className={inputCls}
            >
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Appréciation *">
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="Comportement, progression, points de vigilance…"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-3 py-1.5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {observations.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Aucune observation enregistrée.
        </p>
      ) : (
        <div className="space-y-3">
          {observations.map((obs) => (
            <div
              key={obs.id}
              className="border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  {obs.period}
                </span>
                <span className="text-xs text-gray-400">
                  {obs.author.firstName} {obs.author.lastName}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {obs.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Onglet Documents ──────────────────────────────────────────────────────────

function DocumentsTab({ classId }: { classId?: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-500 mb-3">
        Les documents sont partagés dans l&apos;espace classe.
      </p>
      {classId ? (
        <a
          href={`/classes/${classId}/documents`}
          className="text-sm text-brand-600 hover:underline font-medium"
        >
          Voir les documents de la classe →
        </a>
      ) : (
        <p className="text-xs text-gray-400">
          Aucune classe assignée à cet élève.
        </p>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
