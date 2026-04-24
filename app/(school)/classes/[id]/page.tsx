import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import ClassFeed from "@/components/classes/ClassFeed"

type PageProps = { params: Promise<{ id: string }> }

export default async function ClassPage({ params }: PageProps) {
  const { id: classId } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const schoolId = session.user.schoolId!
  const role = session.user.role
  const userId = session.user.id

  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: {
      teachers: {
        where: { isPrimary: true },
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })
  if (!cls) notFound()

  // Access control
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

  const rawPosts = await prisma.post.findMany({
    where: { classId, schoolId, deletedAt: null },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      attachments: true,
      comments: {
        where: { deletedAt: null },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const posts = rawPosts.map((p) => ({
    id: p.id,
    content: p.content,
    authorName: `${p.author.firstName} ${p.author.lastName}`,
    authorId: p.author.id,
    commentsEnabled: p.commentsEnabled,
    createdAt: p.createdAt.toISOString(),
    attachments: p.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileType: a.fileType,
    })),
    comments: p.comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorName: `${c.author.firstName} ${c.author.lastName}`,
      authorId: c.author.id,
      createdAt: c.createdAt.toISOString(),
    })),
  }))

  const canPost = role === "ADMIN" || role === "TEACHER"
  const teacher = cls.teachers[0]?.user

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/classes" className="hover:underline">Classes</Link>
            <span>/</span>
            <span>{cls.name}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{cls.name}</h1>
          {teacher && (
            <p className="text-sm text-gray-500">
              {teacher.firstName} {teacher.lastName}
            </p>
          )}
        </div>
        <Link
          href={`/classes/${classId}/documents`}
          className="border rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          📁 Documents
        </Link>
      </div>

      <ClassFeed
        classId={classId}
        posts={posts}
        canPost={canPost}
        currentUserId={userId}
        currentRole={role}
      />
    </div>
  )
}
