"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN" || !session.user.schoolId) {
    throw new Error("Accès refusé")
  }
  return session
}

// ── Composition ───────────────────────────────────────────────────────────────

export async function saveComposition(
  assignments: Record<string, string | null>
) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  // Récupère toutes les inscriptions actives de l'année courante
  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true },
  })
  if (!currentYear) throw new Error("Aucune année scolaire courante")

  const classIds = await prisma.class
    .findMany({
      where: { schoolId, academicYearId: currentYear.id },
      select: { id: true },
    })
    .then((cs) => cs.map((c) => c.id))

  // Désinscrire tous les élèves des classes de l'année courante
  await prisma.classEnrollment.updateMany({
    where: {
      schoolId,
      classId: { in: classIds },
      unenrolledAt: null,
    },
    data: { unenrolledAt: new Date() },
  })

  // Réinscrire selon la nouvelle composition
  const toCreate = Object.entries(assignments)
    .filter(([, classId]) => classId !== null)
    .map(([studentId, classId]) => ({
      schoolId,
      studentId,
      classId: classId!,
    }))

  if (toCreate.length > 0) {
    await prisma.classEnrollment.createMany({
      data: toCreate,
      skipDuplicates: true,
    })
  }

  revalidatePath("/classes")
  revalidatePath("/dashboard")
  revalidatePath("/eleves")
}

// ── CRUD classes ──────────────────────────────────────────────────────────────

export async function createClass(name: string, level: string, maxStudents: number) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true },
  })
  if (!currentYear) throw new Error("Aucune année scolaire courante")

  const created = await prisma.class.create({
    data: {
      schoolId,
      academicYearId: currentYear.id,
      name,
      level: level || null,
      maxStudents,
    },
  })

  revalidatePath("/classes/composer")

  return {
    id: created.id,
    name: created.name,
    level: created.level,
    maxStudents: created.maxStudents,
    teacherId: null,
    teacherName: null,
  }
}

export async function assignTeacher(classId: string, userId: string) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  // Retire l'enseignant principal précédent
  await prisma.classTeacher.updateMany({
    where: { classId, schoolId, isPrimary: true },
    data: { isPrimary: false },
  })

  await prisma.classTeacher.upsert({
    where: { classId_userId: { classId, userId } },
    create: { classId, userId, schoolId, isPrimary: true },
    update: { isPrimary: true },
  })

  revalidatePath("/classes/composer")
}
