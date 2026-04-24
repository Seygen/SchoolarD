"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { NotificationScope } from "@prisma/client"

export async function sendNotification(
  title: string,
  body: string,
  scope: NotificationScope,
  targetClassId?: string
) {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    throw new Error("Accès refusé")
  }

  const schoolId = session.user.schoolId

  await prisma.notification.create({
    data: {
      schoolId,
      authorId: session.user.id,
      title,
      body,
      targetScope: scope,
      targetClassId: scope === "CLASS" ? (targetClassId ?? null) : null,
    },
  })

  revalidatePath("/notifications")
  revalidatePath("/dashboard")
}
