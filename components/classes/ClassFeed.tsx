"use client"

import { useState, useTransition, useRef } from "react"
import { createPost, deletePost, addComment, deleteComment } from "@/app/(school)/classes/[id]/actions"
import { FileType } from "@prisma/client"

type Attachment = {
  id: string
  fileName: string
  fileUrl: string
  fileType: FileType
}

type Comment = {
  id: string
  content: string
  authorName: string
  authorId: string
  createdAt: string
}

type Post = {
  id: string
  content: string
  authorName: string
  authorId: string
  commentsEnabled: boolean
  createdAt: string
  attachments: Attachment[]
  comments: Comment[]
}

type Props = {
  classId: string
  posts: Post[]
  canPost: boolean
  currentUserId: string
  currentRole: string
}

function FileIcon({ type }: { type: FileType }) {
  if (type === "PDF") return <span className="text-red-500">📄</span>
  if (type === "IMAGE") return <span className="text-blue-500">🖼️</span>
  return <span className="text-gray-400">📎</span>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CommentSection({
  post,
  classId,
  currentUserId,
  currentRole,
}: {
  post: Post
  classId: string
  currentUserId: string
  currentRole: string
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const visibleComments = post.comments.filter((c) => c.content)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setError("")
    startTransition(async () => {
      try {
        await addComment(post.id, classId, text.trim())
        setText("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      await deleteComment(commentId, classId)
    })
  }

  if (!post.commentsEnabled) return null

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-blue-600 hover:underline"
      >
        {open ? "Masquer" : `Commentaires (${visibleComments.length})`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {visibleComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <div className="flex-1 bg-gray-50 rounded p-2">
                <span className="font-medium">{c.authorName}</span>
                <span className="text-gray-400 text-xs ml-2">{formatDate(c.createdAt)}</span>
                <p className="mt-1 text-gray-700">{c.content}</p>
              </div>
              {(c.authorId === currentUserId || currentRole === "ADMIN" || currentRole === "TEACHER") && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="text-gray-300 hover:text-red-400 text-xs mt-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              type="submit"
              disabled={isPending || !text.trim()}
              className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      )}
    </div>
  )
}

function NewPostForm({ classId }: { classId: string }) {
  const [content, setContent] = useState("")
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setError("")

    const fd = new FormData()
    fd.append("classId", classId)
    fd.append("content", content.trim())
    fd.append("commentsEnabled", String(commentsEnabled))
    files.forEach((f) => fd.append("files", f))

    startTransition(async () => {
      try {
        await createPost(fd)
        setContent("")
        setFiles([])
        if (fileRef.current) fileRef.current.value = ""
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border p-4 space-y-3 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-700">Nouvelle publication</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez un message pour les parents…"
        rows={3}
        className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input
            type="file"
            multiple
            accept=".pdf,image/*"
            ref={fileRef}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="hidden"
          />
          <span
            onClick={() => fileRef.current?.click()}
            className="border rounded px-2 py-1 hover:bg-gray-50 cursor-pointer"
          >
            📎 Joindre un fichier
          </span>
        </label>

        {files.length > 0 && (
          <span className="text-xs text-gray-500">{files.length} fichier(s)</span>
        )}

        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => setCommentsEnabled(e.target.checked)}
            className="rounded"
          />
          Autoriser les commentaires
        </label>

        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Publication…" : "Publier"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  )
}

export default function ClassFeed({
  classId,
  posts,
  canPost,
  currentUserId,
  currentRole,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (postId: string) => {
    startTransition(async () => {
      await deletePost(postId, classId)
    })
  }

  return (
    <div className="space-y-4">
      {canPost && <NewPostForm classId={classId} />}

      {posts.length === 0 && (
        <div className="text-center text-gray-400 py-12 text-sm">
          Aucune publication pour le moment.
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-gray-800 text-sm">{post.authorName}</span>
              <span className="text-gray-400 text-xs ml-2">{formatDate(post.createdAt)}</span>
            </div>
            {(post.authorId === currentUserId || currentRole === "ADMIN") && (
              <button
                onClick={() => handleDelete(post.id)}
                disabled={isPending}
                className="text-gray-300 hover:text-red-400 text-xs"
              >
                Supprimer
              </button>
            )}
          </div>

          <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">{post.content}</p>

          {post.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-gray-50"
                >
                  <FileIcon type={a.fileType} />
                  <span className="max-w-[160px] truncate">{a.fileName}</span>
                </a>
              ))}
            </div>
          )}

          <CommentSection
            post={post}
            classId={classId}
            currentUserId={currentUserId}
            currentRole={currentRole}
          />
        </div>
      ))}
    </div>
  )
}
