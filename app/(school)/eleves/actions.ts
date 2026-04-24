"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { ContactRelationship, StudentLevel, Gender } from "@prisma/client"
import { redirect } from "next/navigation"

async function requireSchoolSession() {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")
  return session
}

// ── Création d'un élève ───────────────────────────────────────────────────────

export async function createStudent(formData: FormData) {
  const session = await requireSchoolSession()
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé")

  const schoolId = session.user.schoolId!
  const firstName = (formData.get("firstName") as string).trim()
  const lastName  = (formData.get("lastName")  as string).trim()
  const dob       = formData.get("dateOfBirth") as string
  const level     = formData.get("level") as StudentLevel
  const gender    = (formData.get("gender") as string) || null
  const notes     = (formData.get("notes") as string).trim() || null

  if (!firstName || !lastName || !dob || !level) throw new Error("Champs obligatoires manquants")

  const student = await prisma.student.create({
    data: {
      schoolId,
      firstName,
      lastName,
      dateOfBirth: new Date(dob),
      level,
      gender: gender as Gender | null,
      notes,
    },
  })

  revalidatePath("/eleves")
  redirect(`/eleves/${student.id}`)
}

// ── Observations ─────────────────────────────────────────────────────────────

export async function upsertObservation(
  studentId: string,
  period: string,
  content: string
) {
  const session = await requireSchoolSession()
  const schoolId = session.user.schoolId!

  const existing = await prisma.studentObservation.findFirst({
    where: { studentId, schoolId, period },
  })

  if (existing) {
    await prisma.studentObservation.update({
      where: { id: existing.id },
      data: { content },
    })
  } else {
    await prisma.studentObservation.create({
      data: {
        studentId,
        schoolId,
        authorId: session.user.id,
        period,
        content,
      },
    })
  }

  revalidatePath(`/eleves/${studentId}`)
}

// ── Données médicales ─────────────────────────────────────────────────────────

export async function upsertMedical(
  studentId: string,
  data: {
    allergies: string
    treatments: string
    paiProtocol: string
    homeSupport: string
    otherNotes: string
  }
) {
  const session = await requireSchoolSession()
  const schoolId = session.user.schoolId!

  await prisma.studentMedical.upsert({
    where: { studentId },
    create: {
      studentId,
      schoolId,
      updatedById: session.user.id,
      ...data,
    },
    update: {
      updatedById: session.user.id,
      ...data,
    },
  })

  revalidatePath(`/eleves/${studentId}`)
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function saveContact(
  studentId: string,
  contactId: string | null,
  data: {
    firstName: string
    lastName: string
    relationship: string
    phone: string
    email: string
    isAuthorizedPickup: boolean
    isEmergencyContact: boolean
  }
) {
  const session = await requireSchoolSession()
  const schoolId = session.user.schoolId!

  const payload = {
    studentId,
    schoolId,
    firstName: data.firstName,
    lastName: data.lastName,
    relationship: data.relationship as ContactRelationship,
    phone: data.phone || null,
    email: data.email || null,
    isAuthorizedPickup: data.isAuthorizedPickup,
    isEmergencyContact: data.isEmergencyContact,
  }

  if (contactId) {
    await prisma.studentContact.update({ where: { id: contactId }, data: payload })
  } else {
    await prisma.studentContact.create({ data: payload })
  }

  revalidatePath(`/eleves/${studentId}`)
}

export async function deleteStudent(studentId: string) {
  const session = await requireSchoolSession()
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé")
  const schoolId = session.user.schoolId!

  // Unenroll from all classes
  await prisma.classEnrollment.updateMany({
    where: { studentId, schoolId, unenrolledAt: null },
    data: { unenrolledAt: new Date() },
  })

  // Soft delete
  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  })

  revalidatePath("/eleves")
  redirect("/eleves")
}

export async function deleteContact(studentId: string, contactId: string) {
  await requireSchoolSession()
  await prisma.studentContact.delete({ where: { id: contactId } })
  revalidatePath(`/eleves/${studentId}`)
}
