import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'

export function SettingsPage() {
  const {
    ready,
    settings,
    setSettings,
    doExport,
    doImport,
    resetPack,
    activePack,
  } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  if (!ready) return <div className="page muted">Cargando…</div>

  const download = async () => {
    const json = await doExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `italiano-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Respaldo descargado')
  }

  const onFile = async (file: File | null) => {
    if (!file) return
    try {
      await doImport(await file.text())
      setMsg('Respaldo restaurado')
    } catch {
      setMsg('No se pudo importar ese archivo')
    }
  }

  return (
    <main className="page">
      <header className="page-head">
        <Link to="/" className="back">
          ← Inicio
        </Link>
        <h1>Ajustes</h1>
      </header>

      <section className="stack">
        <label className="toggle-row">
          <span>Ignorar acentos al escribir</span>
          <input
            type="checkbox"
            checked={settings.ignoreAccents}
            onChange={(e) =>
              void setSettings({ ...settings, ignoreAccents: e.target.checked })
            }
          />
        </label>

        <label className="field">
          Desbloquear pack al llegar a (%)
          <input
            className="input"
            type="number"
            min={50}
            max={100}
            value={Math.round(settings.unlockThreshold * 100)}
            onChange={(e) => {
              const n = Math.min(100, Math.max(50, Number(e.target.value) || 80))
              void setSettings({ ...settings, unlockThreshold: n / 100 })
            }}
          />
        </label>

        <h2>Respaldo local</h2>
        <p className="muted">
          Tus datos están solo en este dispositivo. Exporta un JSON para no
          perderlos.
        </p>
        <button type="button" className="btn" onClick={() => void download()}>
          Exportar progreso
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => fileRef.current?.click()}
        >
          Importar progreso
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />

        <h2>Reiniciar</h2>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (confirm(`¿Borrar progreso del pack ${activePack + 1}?`)) {
              void resetPack(activePack).then(() => setMsg('Pack reiniciado'))
            }
          }}
        >
          Reiniciar pack actual
        </button>

        {msg && <p className="muted">{msg}</p>}
      </section>
    </main>
  )
}
