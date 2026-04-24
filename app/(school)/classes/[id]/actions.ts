"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { storeFile, deleteFile } from "@/lib/storage"

async function requireClassAccess(classId: string) {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")

  const schoolId = session.user.schoolId
  const role = session.user.role
  const userId = session.user.id

  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  })
  if (!cls) throw new Error("Classe introuvable")

  if (role === "ADMIN") return { session, schoolId, cls }

  if (role === "TEACHER") {
    const assigned = await prisma.classTeacher.findFirst({
      where: { classId, userId },
    })
    if (!assigned) throw new Error("Accès refusé")
    return { session, schoolId, cls }
  }

  throw new Error("Accès refusé")
}

// ── Publications ─────────────────────────────────────────────────────────────

export async function createPost(formData: FormData) {
  const classId = formData.get("classId") as string
  const content = formData.get("content") as string
  const commentsEnabled = formData.get("commentsEnabled") === "true"
  const files = formData.getAll("files") as File[]

  const { session, schoolId } = await requireClassAccess(classId)

  const post = await prisma.post.create({
    data: {
      schoolId,
      classId,
      authorId: session.user.id,
      content,
      commentsEnabled,
    },
  })

  for (const file of files) {
    if (file.size === 0) continue
    const stored = await storeFile(file, schoolId, `posts/${post.id}`)
    await prisma.postAttachment.create({
      data: {
        schoolId,
        postId: post.id,
        fileName: file.name,
        fileUrl: stored.fileUrl,
        fileType: stored.fileType,
        fileSizeBytes: stored.fileSizeBytes,
      },
    })
  }

  revalidatePath(`/classes/${classId}`)
}

export async function deletePost(postId: string, classId: string) {
  const { schoolId } = await requireClassAccess(classId)

  const attachments = await prisma.postAttachment.findMany({
    where: { postId },
  })
  for (const a of attachments) await deleteFile(a.fileUrl)

  await prisma.post.update({
    where: { id: postId, schoolId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/classes/${classId}`)
}

// ── Commentaires ─────────────────────────────────────────────────────────────

export async function addComment(postId: string, classId: string, content: string) {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")

  const schoolId = session.user.schoolId

  const post = await prisma.post.findFirst({
    where: { id: postId, schoolId, deletedAt: null, commentsEnabled: true },
  })
  if (!post) throw new Error("Publication introuvable")

  // Parents can comment only if they have a child in this class
  if (session.user.role === "PARENT") {
    const links = await prisma.parentStudentLink.findMany({
      where: { parentUserId: session.user.id, schoolId },
      select: { studentId: true },
    })
    const studentIds = links.map((l) => l.studentId)
    const enrolled = await prisma.classEnrollment.findFirst({
      where: { classId, studentId: { in: studentIds }, unenrolledAt: null },
    })
    if (!enrolled) throw new Error("Accès refusé")
  }

  await prisma.postComment.create({
    data: {
      schoolId,
      postId,
      authorId: session.user.id,
      content,
    },
  })

  revalidatePath(`/classes/${classId}`)
}

export async function deleteComment(commentId: string, classId: string) {
  const session = await auth()
  if (!session || !session.user.schoolId) throw new Error("Non authentifié")

  const schoolId = session.user.schoolId
  const comment = await prisma.postComment.findFirst({
    where: { id: commentId, schoolId },
  })
  if (!comment) throw new Error("Commentaire introuvable")

  // Only admin, teacher of the class, or comment author can delete
  const canDelete =
    session.user.role === "ADMIN" ||
    comment.authorId === session.user.id
  if (!canDelete) {
    const isTeacher = await prisma.classTeacher.findFirst({
      where: { classId, userId: session.user.id },
    })
    if (!isTeacher) throw new Error("Accès refusé")
  }

  await prisma.postComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/classes/${classId}`)
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function createFolder(classId: string, name: string, parentId?: string) {
  const { schoolId } = await requireClassAccess(classId)

  await prisma.documentFolder.create({
    data: {
      schoolId,
      classId,
      name,
      parentId: parentId ?? null,
    },
  })

  revalidatePath(`/classes/${classId}/documents`)
}

export async function uploadDocument(formData: FormData) {
  const classId = formData.get("classId") as string
  const folderId = (formData.get("folderId") as string) || null
  const file = formData.get("file") as File

  const { session, schoolId } = await requireClassAccess(classId)
  if (file.size === 0) throw new Error("Fichier vide")

  const stored = await storeFile(file, schoolId, `documents/${classId}`)
  await prisma.document.create({
    data: {
      schoolId,
      classId,
      folderId,
      uploaderId: session.user.id,
      name: file.name,
      fileUrl: stored.fileUrl,
      fileType: stored.fileType,
      fileSizeBytes: stored.fileSizeBytes,
    },
  })

  revalidatePath(`/classes/${classId}/documents`)
}

export async function deleteDocument(documentId: string, classId: string) {
  const { schoolId } = await requireClassAccess(classId)

  const doc = await prisma.document.findFirst({
    where: { id: documentId, schoolId },
  })
  if (!doc) throw new Error("Document introuvable")

  await deleteFile(doc.fileUrl)
  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/classes/${classId}/documents`)
}
