import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ImportWizard from "@/components/import/ImportWizard"

export default async function ImportPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Import de données</h1>
      <p className="text-sm text-gray-500 mb-6">
        Importez une liste d&apos;élèves depuis un fichier Excel ou CSV.
      </p>
      <ImportWizard />
    </div>
  )
}
