import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import DocumentLibrary from "@/components/classes/DocumentLibrary"

type PageProps = { params: Promise<{ id: string }> }

export default async function ClassDocumentsPage({ params }: PageProps) {
  const { id: classId } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const schoolId = session.user.schoolId!
  const role = session.user.role
  const userId = session.user.id

  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  })
  if (!cls) notFound()

  // Same access control as the feed
  if (role === "TEACHER") {
    const assigned = await prisma.classTeacher.findFirst({ where: { classId, userId } })
    if (!assigned) redirect("/classes")
  } else if (role === "PARENT") {
    const links = await prisma.parentStudentLink.findMany({
      where: { parentUserId: userId, schoolId },
      select: { studentId: true },
    })
    const studentIds = links.map((l) => l.studentId)
    const enrolled = await prisma.classEnrollment.findFirst({
      where: { classId, studentId: { in: studentIds }, unenrolledAt: null },
    })
    if (!enrolled) redirect("/classes")
  } else if (role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [folders, rawDocs] = await Promise.all([
    prisma.documentFolder.findMany({
      where: { schoolId, classId },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { schoolId, classId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const documents = rawDocs.map((d) => ({
    id: d.id,
    name: d.name,
    fileUrl: d.fileUrl,
    fileType: d.fileType,
    fileSizeBytes: d.fileSizeBytes,
    folderId: d.folderId,
    createdAt: d.createdAt.toISOString(),
  }))

  const canUpload = role === "ADMIN" || role === "TEACHER"

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <span>/</span>
            <Link href={`/classes/${classId}`} className="hover:underline">{cls.name}</Link>
            <span>/</span>
            <span>Documents</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Documents — {cls.name}</h1>
        </div>
        <Link
          href={`/classes/${classId}`}
          className="border rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← Fil d&apos;actualité
        </Link>
      </div>

      <DocumentLibrary
        classId={classId}
        folders={folders}
        documents={documents}
        canUpload={canUpload}
      />
    </div>
  )
}
