"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...code]
    next[index] = value
    setCode(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = code.join("")
    if (token.length !== 6) return

    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/verify-totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    setLoading(false)

    if (!res.ok) {
      setError("Code incorrect. Vérifiez votre application d'authentification.")
      setCode(["", "", "", "", "", ""])
      inputs.current[0]?.focus()
      return
    }

    router.push("/superadmin/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vérification en deux étapes</h1>
        <p className="text-sm text-gray-500 mt-2">
          Entrez le code affiché dans votre application d&apos;authentification.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.some((d) => !d)}
          className="w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Vérification…" : "Vérifier"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <a href="/login" className="text-sm text-gray-500 hover:underline">
          ← Retour à la connexion
        </a>
      </div>
    </div>
  )
}
