"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { createStudent } from "@/app/(school)/eleves/actions"
import Link from "next/link"

const LEVELS = ["TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"]

export default function NouvelElevePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createStudent(fd)
      } catch (err) {
        // redirect() throws internally — only real errors reach here
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          alert(err.message)
        }
      }
    })
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/eleves" className="hover:underline">Élèves</Link>
        <span>/</span>
        <span>Nouvel élève</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Ajouter un élève</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              name="firstName"
              required
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              name="lastName"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance <span className="text-red-500">*</span>
          </label>
          <input
            name="dateOfBirth"
            type="date"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau <span className="text-red-500">*</span>
            </label>
            <select
              name="level"
              required
              defaultValue=""
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>-- Choisir --</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
            <select
              name="gender"
              defaultValue=""
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Non renseigné</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="X">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Informations complémentaires…"
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
          >
            {isPending ? "Enregistrement…" : "Ajouter l'élève"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
