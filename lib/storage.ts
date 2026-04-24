import fs from "fs/promises"
import path from "path"
import { FileType } from "@prisma/client"

function getFileType(mimeType: string): FileType {
  if (mimeType === "application/pdf") return "PDF"
  if (mimeType.startsWith("image/")) return "IMAGE"
  if (mimeType.startsWith("audio/")) return "AUDIO"
  if (mimeType.startsWith("video/")) return "VIDEO"
  return "OTHER"
}

export async function storeFile(
  file: File,
  schoolId: string,
  subfolder: string
) {
  const dir = path.join(process.cwd(), "public", "uploads", schoolId, subfolder)
  await fs.mkdir(dir, { recursive: true })
  const ext = path.extname(file.name) || ""
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(dir, safeName), buffer)
  return {
    fileUrl: `/uploads/${schoolId}/${subfolder}/${safeName}`,
    fileType: getFileType(file.type),
    fileSizeBytes: BigInt(buffer.length),
  }
}

export async function deleteFile(fileUrl: string) {
  const relativePath = fileUrl.replace(/^\//, "")
  const filePath = path.join(process.cwd(), "public", relativePath)
  await fs.unlink(filePath).catch(() => {})
}
