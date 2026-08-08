import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { isLoggedIn, login } from '../lib/auth'

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isLoggedIn()) return <Navigate to="/" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const ok = login(email, password)
    setBusy(false)
    if (!ok) {
      setError('Correo o contraseña incorrectos')
      return
    }
    onSuccess()
  }

  return (
    <main className="page login-page">
      <div className="login-hero">
        <img
          className="login-icon"
          src="/pwa-512.png"
          alt="Italiano"
          width={128}
          height={128}
        />
        <p className="eyebrow">Impara · 5000 parole</p>
        <h1>Italiano</h1>
        <p className="lede">Entra para seguir aprendiendo</p>
      </div>

      <form className="login-form stack" onSubmit={onSubmit}>
        <label className="field">
          Correo
          <input
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </label>
        <label className="field">
          Contraseña
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
