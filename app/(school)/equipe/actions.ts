"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { StaffType, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN" || !session.user.schoolId) {
    throw new Error("Accès refusé")
  }
  return session
}

// ── Enseignants (User avec role TEACHER) ─────────────────────────────────────

export async function createTeacher(formData: FormData) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  const firstName = (formData.get("firstName") as string).trim()
  const lastName  = (formData.get("lastName")  as string).trim()
  const email     = (formData.get("email")     as string).trim().toLowerCase()
  const password  = (formData.get("password")  as string)

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Tous les champs sont obligatoires")
  }

  const existing = await prisma.user.findFirst({ where: { schoolId, email } })
  if (existing) throw new Error("Un compte avec cet email existe déjà")

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { schoolId, email, passwordHash, firstName, lastName, role: "TEACHER" },
  })

  revalidatePath("/equipe")
}

export async function deleteTeacher(userId: string) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  await prisma.user.update({
    where: { id: userId, schoolId },
    data: { isActive: false },
  })

  revalidatePath("/equipe")
}

// ── Personnel (StaffMember — AESH, AVS, OTHER) ───────────────────────────────

export async function createStaffMember(formData: FormData) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  const firstName = (formData.get("firstName") as string).trim()
  const lastName  = (formData.get("lastName")  as string).trim()
  const staffType = (formData.get("staffType") as StaffType)
  const email     = (formData.get("email")     as string | null)?.trim() || null
  const phone     = (formData.get("phone")     as string | null)?.trim() || null

  if (!firstName || !lastName) throw new Error("Prénom et nom obligatoires")

  await prisma.staffMember.create({
    data: { schoolId, firstName, lastName, staffType, email, phone },
  })

  revalidatePath("/equipe")
}

export async function deleteStaffMember(staffId: string) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  await prisma.staffMember.update({
    where: { id: staffId, schoolId },
    data: { isActive: false },
  })

  revalidatePath("/equipe")
}

// ── Assignation aux classes ───────────────────────────────────────────────────

export async function assignTeacherToClass(userId: string, classId: string | null) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  // Remove existing primary assignment for this teacher
  await prisma.classTeacher.updateMany({
    where: { userId, schoolId, isPrimary: true },
    data: { isPrimary: false },
  })

  if (classId) {
    await prisma.classTeacher.upsert({
      where: { classId_userId: { classId, userId } },
      create: { classId, userId, schoolId, isPrimary: true },
      update: { isPrimary: true },
    })
  }

  revalidatePath("/equipe")
  revalidatePath("/classes/composer")
}

export async function assignStaffToClass(staffId: string, classId: string | null) {
  const session = await requireAdmin()
  const schoolId = session.user.schoolId!

  // Remove all existing class assignments for this staff member
  await prisma.classStaff.deleteMany({ where: { staffMemberId: staffId, schoolId } })

  if (classId) {
    await prisma.classStaff.create({
      data: { classId, staffMemberId: staffId, schoolId },
    })
  }

  revalidatePath("/equipe")
}
