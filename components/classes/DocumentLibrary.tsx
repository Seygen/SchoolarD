"use client"

import { useState, useTransition, useRef } from "react"
import { createFolder, uploadDocument, deleteDocument } from "@/app/(school)/classes/[id]/actions"
import { FileType } from "@prisma/client"

type Folder = {
  id: string
  name: string
  parentId: string | null
}

type Doc = {
  id: string
  name: string
  fileUrl: string
  fileType: FileType
  fileSizeBytes: bigint | null
  folderId: string | null
  createdAt: string
}

type Props = {
  classId: string
  folders: Folder[]
  documents: Doc[]
  canUpload: boolean
}

function fileIcon(type: FileType) {
  if (type === "PDF") return "📄"
  if (type === "IMAGE") return "🖼️"
  return "📎"
}

function formatSize(bytes: bigint | null) {
  if (!bytes) return ""
  const n = Number(bytes)
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / 1024 / 1024).toFixed(1)} Mo`
}

export default function DocumentLibrary({ classId, folders, documents, canUpload }: Props) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const breadcrumb: Folder[] = []
  let cur = currentFolderId
  while (cur) {
    const f = folders.find((x) => x.id === cur)
    if (!f) break
    breadcrumb.unshift(f)
    cur = f.parentId
  }

  const visibleFolders = folders.filter((f) => f.parentId === currentFolderId)
  const visibleDocs = documents.filter((d) => d.folderId === currentFolderId)

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderName.trim()) return
    setError("")
    startTransition(async () => {
      try {
        await createFolder(classId, folderName.trim(), currentFolderId ?? undefined)
        setFolderName("")
        setShowNewFolder(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    const fd = new FormData()
    fd.append("classId", classId)
    fd.append("file", file)
    if (currentFolderId) fd.append("folderId", currentFolderId)

    startTransition(async () => {
      try {
        await uploadDocument(fd)
        if (fileRef.current) fileRef.current.value = ""
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const handleDelete = (docId: string) => {
    startTransition(async () => {
      await deleteDocument(docId, classId)
    })
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-wrap">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="text-blue-600 hover:underline shrink-0"
          >
            Racine
          </button>
          {breadcrumb.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <span className="text-gray-400">/</span>
              <button
                onClick={() => setCurrentFolderId(f.id)}
                className="text-blue-600 hover:underline truncate max-w-[120px]"
              >
                {f.name}
              </button>
            </span>
          ))}
        </nav>

        {canUpload && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNewFolder((v) => !v)}
              className="text-sm border rounded px-2 py-1 hover:bg-gray-50"
            >
              + Dossier
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isPending}
              className="text-sm bg-blue-600 text-white rounded px-3 py-1 disabled:opacity-50"
            >
              {isPending ? "Envoi…" : "↑ Fichier"}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          </div>
        )}
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="flex gap-2 px-4 py-2 bg-gray-50 border-b">
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Nom du dossier"
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || !folderName.trim()}
            className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => setShowNewFolder(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Annuler
          </button>
        </form>
      )}

      {error && <p className="px-4 py-2 text-red-500 text-sm">{error}</p>}

      {/* Content */}
      <div className="divide-y">
        {visibleFolders.map((f) => (
          <button
            key={f.id}
            onClick={() => setCurrentFolderId(f.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
          >
            <span className="text-yellow-400 text-lg">📁</span>
            <span className="text-sm font-medium text-gray-800">{f.name}</span>
          </button>
        ))}

        {visibleDocs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="text-lg">{fileIcon(d.fileType)}</span>
            <div className="flex-1 min-w-0">
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-700 hover:underline truncate block"
              >
                {d.name}
              </a>
              <span className="text-xs text-gray-400">{formatSize(d.fileSizeBytes)}</span>
            </div>
            {canUpload && (
              <button
                onClick={() => handleDelete(d.id)}
                disabled={isPending}
                className="text-gray-300 hover:text-red-400 text-xs"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}

        {visibleFolders.length === 0 && visibleDocs.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Dossier vide.</p>
        )}
      </div>
    </div>
  )
}
