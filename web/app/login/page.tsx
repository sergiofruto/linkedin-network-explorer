'use client'
import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: value }),
    })

    if (res.ok) {
      const from = searchParams.get('from') ?? '/'
      router.replace(from)
    } else {
      setError(true)
      setLoading(false)
      setValue('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-80 space-y-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Network Explorer</p>
          <h1 className="text-lg font-semibold text-white">Enter password to continue</h1>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors ${
              error ? 'border-rose-500/60' : 'border-white/10 focus:border-white/25'
            }`}
          />
          {error && <p className="text-xs text-rose-400">Incorrect password.</p>}
          <button
            type="submit"
            disabled={loading || !value}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
          >
            {loading ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
