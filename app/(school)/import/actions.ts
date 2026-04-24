"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { StudentLevel, Gender } from "@prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParsedRow = Record<string, string>

export type ParseResult = {
  headers: string[]
  rows: ParsedRow[]
  total: number
}

export type ColumnMapping = {
  firstName: string
  lastName: string
  level: string
  dateOfBirth: string
  gender?: string
}

export type ValidationResult = {
  valid: NormalizedStudent[]
  errors: { row: number; message: string }[]
  duplicates: NormalizedStudent[]
}

export type NormalizedStudent = {
  firstName: string
  lastName: string
  level: StudentLevel
  dateOfBirth: string
  gender: Gender | null
}

export type ImportResult = {
  imported: number
  skipped: number
}

// ── Parsing ───────────────────────────────────────────────────────────────────

export async function parseImportFile(formData: FormData): Promise<ParseResult> {
  const file = formData.get("file") as File
  if (!file) throw new Error("Aucun fichier fourni")

  const name = file.name.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(buffer)
  }
  if (name.endsWith(".csv")) {
    return parseCsv(buffer.toString("utf-8"))
  }

  throw new Error("Format non supporté. Utilisez .xlsx, .xls ou .csv")
}

function excelCellToString(value: unknown): string {
  if (value == null) return ""
  // xlsx avec cellDates:true renvoie des objets Date pour les cellules de type date
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, "0")
    const d = String(value.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  return String(value).trim()
}

function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false }) as unknown[][]

  if (!raw.length) return { headers: [], rows: [], total: 0 }

  const headers = (raw[0] as unknown[]).map((h) => String(h ?? "").trim())
  const dataRows = raw
    .slice(1)
    .filter((row) => (row as unknown[]).some((c) => c != null && c !== ""))
    .map((row) => {
      const obj: ParsedRow = {}
      headers.forEach((h, i) => {
        obj[h] = excelCellToString((row as unknown[])[i])
      })
      return obj
    })

  return { headers, rows: dataRows.slice(0, 1000), total: dataRows.length }
}

function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [], total: 0 }

  const sep = lines[0].includes(";") ? ";" : ","
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""))
    const obj: ParsedRow = {}
    headers.forEach((h, i) => { obj[h] = cells[i] ?? "" })
    return obj
  })

  return { headers, rows: rows.slice(0, 1000), total: rows.length }
}

// ── Validation ────────────────────────────────────────────────────────────────

const LEVEL_MAP: Record<string, StudentLevel> = {
  tps: "TPS", ps: "PS", ms: "MS", gs: "GS",
  cp: "CP", ce1: "CE1", ce2: "CE2", cm1: "CM1", cm2: "CM2",
  "petite section": "PS", "moyenne section": "MS", "grande section": "GS",
  "cours préparatoire": "CP",
  "cours élémentaire 1": "CE1", "ce 1": "CE1",
  "cours élémentaire 2": "CE2", "ce 2": "CE2",
  "cours moyen 1": "CM1", "cm 1": "CM1",
  "cours moyen 2": "CM2", "cm 2": "CM2",
}

function normalizeLevel(raw: string): StudentLevel | null {
  return LEVEL_MAP[raw.toLowerCase().trim()] ?? null
}

function normalizeGender(raw: string): Gender | null {
  const v = raw.toLowerCase().trim()
  if (["f", "fille", "female", "femme"].includes(v)) return "F"
  if (["m", "garçon", "garcon", "male", "homme"].includes(v)) return "M"
  return null
}

function normalizeDate(raw: string): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
  // YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`
  return null
}

export async function validateRows(
  rows: ParsedRow[],
  mapping: ColumnMapping
): Promise<ValidationResult> {
  const session = await auth()
  if (!session?.user.schoolId) throw new Error("Non authentifié")

  const schoolId = session.user.schoolId

  const existing = await prisma.student.findMany({
    where: { schoolId, isActive: true },
    select: { firstName: true, lastName: true, level: true },
  })
  const existingSet = new Set(
    existing.map((s) => `${s.firstName.toLowerCase()}|${s.lastName.toLowerCase()}|${s.level}`)
  )

  const valid: NormalizedStudent[] = []
  const errors: { row: number; message: string }[] = []
  const duplicates: NormalizedStudent[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const firstName = row[mapping.firstName]?.trim()
    const lastName = row[mapping.lastName]?.trim()
    const rawLevel = row[mapping.level]?.trim()

    if (!firstName) {
      errors.push({ row: rowNum, message: "Prénom manquant" })
      return
    }
    if (!lastName) {
      errors.push({ row: rowNum, message: "Nom manquant" })
      return
    }

    const level = normalizeLevel(rawLevel ?? "")
    if (!level) {
      errors.push({ row: rowNum, message: `Niveau inconnu : "${rawLevel}"` })
      return
    }

    const rawDob = row[mapping.dateOfBirth]?.trim() ?? ""
    const dateOfBirth = normalizeDate(rawDob)
    if (!dateOfBirth) {
      errors.push({ row: rowNum, message: `Date de naissance invalide ou manquante : "${rawDob}"` })
      return
    }

    const student: NormalizedStudent = {
      firstName,
      lastName,
      level,
      dateOfBirth,
      gender: mapping.gender ? normalizeGender(row[mapping.gender]) : null,
    }

    const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${level}`
    if (existingSet.has(key)) {
      duplicates.push(student)
    } else {
      valid.push(student)
      existingSet.add(key)
    }
  })

  return { valid, errors, duplicates }
}

// ── Import ────────────────────────────────────────────────────────────────────

export async function importStudents(
  students: NormalizedStudent[]
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user.schoolId) throw new Error("Non authentifié")

  const schoolId = session.user.schoolId

  await prisma.student.createMany({
    data: students.map((s) => ({
      schoolId,
      firstName: s.firstName,
      lastName: s.lastName,
      level: s.level,
      dateOfBirth: new Date(s.dateOfBirth),
      gender: s.gender,
      isActive: true,
    })),
    skipDuplicates: true,
  })

  revalidatePath("/eleves")

  return { imported: students.length, skipped: 0 }
}
