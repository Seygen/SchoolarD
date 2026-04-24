import type { ColumnMapping } from "@/app/(school)/import/actions"

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  firstName:   ["prénom", "prenom", "first name", "firstname", "given name"],
  lastName:    ["nom", "nom de famille", "last name", "lastname", "family name", "surname"],
  level:       ["niveau", "classe", "level", "grade", "section"],
  dateOfBirth: ["date de naissance", "naissance", "ddn", "date_naissance", "birthdate", "birth date"],
  gender:      ["genre", "sexe", "gender", "sex"],
}

export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const lower = headers.map((h) => h.toLowerCase().trim())
  const mapping: Partial<ColumnMapping> = {}

  for (const [field, synonyms] of Object.entries(SYNONYMS) as [keyof ColumnMapping, string[]][]) {
    const match = lower.findIndex((h) => synonyms.some((s) => h.includes(s)))
    if (match !== -1) mapping[field] = headers[match]
  }

  return mapping
}
