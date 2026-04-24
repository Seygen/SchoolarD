"use client"

import { useState, useTransition } from "react"
import { deleteStudent } from "@/app/(school)/eleves/actions"

export default function DeleteStudentButton({ studentId }: { studentId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteStudent(studentId)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          alert(err.message)
        }
      }
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Supprimer cet élève ?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs bg-red-500 text-white rounded px-3 py-1 disabled:opacity-50"
        >
          {isPending ? "Suppression…" : "Confirmer"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs border rounded px-3 py-1 text-gray-500"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded px-3 py-1 transition-colors"
    >
      Supprimer l&apos;élève
    </button>
  )
}
