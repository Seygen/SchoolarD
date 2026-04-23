"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { ContactRelationship } from "@prisma/client"

async function requireSchoolSession() {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")
  return session
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

export async function deleteContact(studentId: string, contactId: string) {
  await requireSchoolSession()
  await prisma.studentContact.delete({ where: { id: contactId } })
  revalidatePath(`/eleves/${studentId}`)
}
