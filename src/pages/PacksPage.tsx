import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useApp } from '../lib/store'
import { packLabel } from '../lib/catalog'

export function PacksPage() {
  const { ready, packStats, activePack } = useApp()
  if (!ready) return <div className="page muted">Cargando…</div>

  return (
    <main className="page">
      <header className="page-head">
        <Link to="/" className="back">
          ← Inicio
        </Link>
        <h1>Packs</h1>
        <p className="muted">100 palabras cada uno</p>
      </header>
      <ul className="pack-list">
        {packStats.map((s) => {
          const pct = Math.round(s.ratio * 100)
          return (
            <li key={s.pack}>
              {s.unlocked ? (
                <Link
                  to={`/study/${s.pack}/cards`}
                  className={`pack-item ${s.pack === activePack ? 'on' : ''}`}
                >
                  <div>
                    <strong>Pack {s.pack + 1}</strong>
                    <span className="muted"> · {packLabel(s.pack)}</span>
                    <p className="muted">
                      {s.known}/{s.total} conocidas · {s.learning} en curso
                    </p>
                  </div>
                  <span className="pct-sm">{pct}%</span>
                </Link>
              ) : (
                <div className="pack-item locked">
                  <div>
                    <strong>Pack {s.pack + 1}</strong>
                    <span className="muted"> · {packLabel(s.pack)}</span>
                    <p className="muted">Completa el pack anterior</p>
                  </div>
                  <Lock size={18} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
