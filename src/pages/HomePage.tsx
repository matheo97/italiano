import { Link } from 'react-router-dom'
import { BookOpen, Layers, Settings } from 'lucide-react'
import { useApp } from '../lib/store'
import { words } from '../lib/catalog'
import { packLabel } from '../lib/catalog'
import { globalKnown } from '../lib/progress'
import { PACK_COUNT } from '../lib/types'

export function HomePage() {
  const { ready, packStats, activePack, wordProgress, settings } = useApp()
  if (!ready) return <div className="page muted">Cargando…</div>

  const stats = packStats[activePack]
  const known = globalKnown(wordProgress, words)
  const pct = Math.round((stats?.ratio ?? 0) * 100)
  const need = Math.round(settings.unlockThreshold * 100)

  return (
    <main className="page home">
      <header className="hero">
        <p className="eyebrow">Impara · 5000 parole</p>
        <h1>Italiano</h1>
        <p className="lede">
          {known} de {words.length} palabras conocidas · pack {activePack + 1}/
          {PACK_COUNT}
        </p>
      </header>

      <section className="current-pack">
        <div className="pack-head">
          <div>
            <h2>Pack {activePack + 1}</h2>
            <p className="muted">{packLabel(activePack)}</p>
          </div>
          <strong className="pct">{pct}%</strong>
        </div>
        <div className="bar" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="muted tip">
          Alcanza {need}% conocidas para desbloquear el siguiente pack.
        </p>
        <div className="modes">
          <Link className="mode" to={`/study/${activePack}/cards`}>
            Cards
          </Link>
          <Link className="mode" to={`/study/${activePack}/abc`}>
            ABC
          </Link>
          <Link className="mode" to={`/study/${activePack}/write`}>
            Escribir
          </Link>
          <Link className="mode" to={`/study/${activePack}/phrases`}>
            Frases
          </Link>
        </div>
      </section>

      <nav className="home-links">
        <Link to="/packs" className="link-row">
          <Layers size={20} /> Todos los packs
        </Link>
        <Link to="/settings" className="link-row">
          <Settings size={20} /> Ajustes y respaldo
        </Link>
        <p className="muted offline">
          <BookOpen size={16} /> Progreso guardado en este teléfono
        </p>
      </nav>
    </main>
  )
}
