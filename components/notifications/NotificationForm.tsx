"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendNotification } from "@/app/(school)/notifications/new/actions"

type Class = { id: string; name: string }

type Props = {
  classes: Class[]
}

export default function NotificationForm({ classes }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scope, setScope] = useState<"SCHOOL" | "CLASS">("SCHOOL")
  const [targetClassId, setTargetClassId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    if (scope === "CLASS" && !targetClassId) return
    setError("")

    startTransition(async () => {
      try {
        await sendNotification(
          title.trim(),
          body.trim(),
          scope,
          scope === "CLASS" ? targetClassId : undefined
        )
        setSent(true)
        setTimeout(() => router.push("/dashboard"), 1500)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
      }
    })
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-700 font-medium">Notification envoyée !</p>
        <p className="text-green-600 text-sm mt-1">Redirection en cours…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Réunion parents d'élèves"
          maxLength={120}
          required
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Contenu de la notification…"
          rows={5}
          required
          className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="SCHOOL"
              checked={scope === "SCHOOL"}
              onChange={() => setScope("SCHOOL")}
            />
            <span className="text-sm">Toute l&apos;école</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="CLASS"
              checked={scope === "CLASS"}
              onChange={() => setScope("CLASS")}
            />
            <span className="text-sm">Une classe</span>
          </label>
        </div>
      </div>

      {scope === "CLASS" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classe cible *</label>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choisir une classe --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white rounded px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Envoyer la notification"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border rounded px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
