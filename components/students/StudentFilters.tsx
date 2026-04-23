"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { LEVELS_ORDERED } from "@/lib/constants"

type ClassOption = { id: string; name: string }

export default function StudentFilters({
  classes,
  defaultQ,
  defaultLevel,
  defaultClassId,
}: {
  classes: ClassOption[]
  defaultQ?: string
  defaultLevel?: string
  defaultClassId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3">
      {/* Recherche */}
      <input
        type="search"
        defaultValue={defaultQ}
        placeholder="Rechercher un élève…"
        onChange={(e) => update("q", e.target.value)}
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      />

      {/* Filtre niveau */}
      <select
        defaultValue={defaultLevel ?? ""}
        onChange={(e) => update("level", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-600"
      >
        <option value="">Tous les niveaux</option>
        {LEVELS_ORDERED.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      {/* Filtre classe */}
      <select
        defaultValue={defaultClassId ?? ""}
        onChange={(e) => update("class", e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-gray-600"
      >
        <option value="">Toutes les classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
