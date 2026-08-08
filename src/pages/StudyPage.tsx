import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useApp } from '../lib/store'
import {
  answersMatch,
  packLabel,
  phrasesForPack,
  pickDistractors,
  shuffle,
  wordsForPack,
} from '../lib/catalog'
import type { Phrase, StudyMode, Word } from '../lib/types'

function isMode(v: string): v is StudyMode {
  return v === 'cards' || v === 'abc' || v === 'write' || v === 'phrases'
}

export function StudyPage() {
  const { pack: packStr, mode: modeStr } = useParams()
  const pack = Number(packStr)
  const mode = modeStr ?? ''
  const { ready, packStats, settings, markWord, markPhrase } = useApp()

  if (!ready) return <div className="page muted">Cargando…</div>
  if (!Number.isInteger(pack) || pack < 0 || pack > 49 || !isMode(mode)) {
    return <Navigate to="/" replace />
  }
  if (!packStats[pack]?.unlocked) {
    return (
      <main className="page">
        <p className="muted">Este pack aún está bloqueado.</p>
        <Link to="/packs">Ver packs</Link>
      </main>
    )
  }

  return (
    <main className="page study">
      <header className="page-head">
        <Link to="/" className="back">
          ← Inicio
        </Link>
        <h1>
          Pack {pack + 1} ·{' '}
          {mode === 'cards'
            ? 'Cards'
            : mode === 'abc'
              ? 'ABC'
              : mode === 'write'
                ? 'Escribir'
                : 'Frases'}
        </h1>
        <p className="muted">{packLabel(pack)}</p>
      </header>

      <nav className="mode-tabs">
        {(['cards', 'abc', 'write', 'phrases'] as StudyMode[]).map((m) => (
          <Link
            key={m}
            to={`/study/${pack}/${m}`}
            className={`chip ${m === mode ? 'on' : ''}`}
          >
            {m === 'cards'
              ? 'Cards'
              : m === 'abc'
                ? 'ABC'
                : m === 'write'
                  ? 'Escribir'
                  : 'Frases'}
          </Link>
        ))}
      </nav>

      {mode === 'cards' && (
        <CardsMode
          words={wordsForPack(pack)}
          onResult={(id, ok) => void markWord(id, ok)}
        />
      )}
      {mode === 'abc' && (
        <AbcMode
          words={wordsForPack(pack)}
          onResult={(id, ok) => void markWord(id, ok)}
        />
      )}
      {mode === 'write' && (
        <WriteMode
          words={wordsForPack(pack)}
          ignoreAccents={settings.ignoreAccents}
          onResult={(id, ok) => void markWord(id, ok)}
        />
      )}
      {mode === 'phrases' && (
        <PhrasesMode
          phrases={phrasesForPack(pack)}
          ignoreAccents={settings.ignoreAccents}
          onResult={(id, ok) => void markPhrase(id, ok)}
        />
      )}
    </main>
  )
}

function CardsMode({
  words,
  onResult,
}: {
  words: Word[]
  onResult: (id: string, ok: boolean) => void
}) {
  const deck = useMemo(() => shuffle(words), [words])
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = deck[i]

  if (!card) return <p className="muted">Sin palabras.</p>

  const next = (ok: boolean) => {
    onResult(card.id, ok)
    setFlipped(false)
    setI((x) => (x + 1) % deck.length)
  }

  return (
    <section className="card-stage">
      <p className="progress-label">
        {i + 1} / {deck.length}
      </p>
      <button
        type="button"
        className={`flash ${flipped ? 'flip' : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <span className="prompt">{flipped ? card.it : card.es}</span>
        <span className="hint">{flipped ? 'italiano' : 'español · toca'}</span>
      </button>
      {flipped && (
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => next(false)}>
            La repaso
          </button>
          <button type="button" className="btn" onClick={() => next(true)}>
            La sé
          </button>
        </div>
      )}
    </section>
  )
}

function AbcMode({
  words,
  onResult,
}: {
  words: Word[]
  onResult: (id: string, ok: boolean) => void
}) {
  const [queue, setQueue] = useState(() => shuffle(words))
  const [picked, setPicked] = useState<string | null>(null)
  const current = queue[0]

  const options = useMemo(() => {
    if (!current) return []
    return shuffle([current, ...pickDistractors(current, words, 2)])
  }, [current, words])

  if (!current) return <p className="muted">Sin palabras.</p>

  const choose = (opt: Word) => {
    if (picked) return
    const ok = opt.id === current.id
    setPicked(opt.id)
    onResult(current.id, ok)
    window.setTimeout(() => {
      setPicked(null)
      setQueue((q) => shuffle(q.slice(1).concat(ok ? [] : [current])))
    }, 650)
  }

  return (
    <section className="quiz">
      <p className="big-prompt">{current.es}</p>
      <p className="muted">Elige el italiano</p>
      <div className="choices">
        {options.map((opt, idx) => {
          const letter = 'ABC'[idx]
          let cls = 'choice'
          if (picked) {
            if (opt.id === current.id) cls += ' good'
            else if (opt.id === picked) cls += ' bad'
          }
          return (
            <button
              key={opt.id}
              type="button"
              className={cls}
              disabled={Boolean(picked)}
              onClick={() => choose(opt)}
            >
              <span className="letter">{letter}</span>
              {opt.it}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function WriteMode({
  words,
  ignoreAccents,
  onResult,
}: {
  words: Word[]
  ignoreAccents: boolean
  onResult: (id: string, ok: boolean) => void
}) {
  const [queue, setQueue] = useState(() => shuffle(words))
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const current = queue[0]

  useEffect(() => {
    setValue('')
    setFeedback(null)
  }, [current?.id])

  if (!current) return <p className="muted">Sin palabras.</p>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (feedback) return
    const ok = answersMatch(value, current.it, ignoreAccents)
    setFeedback(ok ? 'ok' : 'bad')
    onResult(current.id, ok)
    window.setTimeout(() => {
      setQueue((q) =>
        shuffle(q.slice(1).concat(ok ? [] : [current])),
      )
    }, 900)
  }

  return (
    <section className="quiz">
      <p className="big-prompt">{current.es}</p>
      <p className="muted">Escríbela en italiano</p>
      <form onSubmit={submit} className="stack">
        <input
          className={`input ${feedback === 'ok' ? 'ok' : feedback === 'bad' ? 'bad' : ''}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          placeholder="italiano…"
        />
        {feedback === 'bad' && (
          <p className="answer-reveal">Era: <strong>{current.it}</strong></p>
        )}
        {feedback === 'ok' && <p className="answer-reveal ok">¡Correcto!</p>}
        <button className="btn" type="submit" disabled={Boolean(feedback)}>
          Comprobar
        </button>
      </form>
    </section>
  )
}

function PhrasesMode({
  phrases,
  ignoreAccents,
  onResult,
}: {
  phrases: Phrase[]
  ignoreAccents: boolean
  onResult: (id: string, ok: boolean) => void
}) {
  const [sub, setSub] = useState<'cards' | 'abc' | 'write'>('cards')
  const deck = useMemo(() => shuffle(phrases), [phrases])

  if (!phrases.length) return <p className="muted">Sin frases en este pack.</p>

  return (
    <section>
      <div className="mode-tabs tight">
        {(['cards', 'abc', 'write'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${sub === m ? 'on' : ''}`}
            onClick={() => setSub(m)}
          >
            {m === 'cards' ? 'Cards' : m === 'abc' ? 'ABC' : 'Escribir'}
          </button>
        ))}
      </div>
      {sub === 'cards' && (
        <PhraseCards deck={deck} onResult={onResult} />
      )}
      {sub === 'abc' && (
        <PhraseAbc phrases={phrases} onResult={onResult} />
      )}
      {sub === 'write' && (
        <PhraseWrite
          phrases={phrases}
          ignoreAccents={ignoreAccents}
          onResult={onResult}
        />
      )}
    </section>
  )
}

function PhraseCards({
  deck,
  onResult,
}: {
  deck: Phrase[]
  onResult: (id: string, ok: boolean) => void
}) {
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = deck[i]
  if (!card) return null
  const next = (ok: boolean) => {
    onResult(card.id, ok)
    setFlipped(false)
    setI((x) => (x + 1) % deck.length)
  }
  return (
    <section className="card-stage">
      <button
        type="button"
        className={`flash ${flipped ? 'flip' : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <span className="prompt">{flipped ? card.it : card.es}</span>
        <span className="hint">{flipped ? 'italiano' : 'español · toca'}</span>
      </button>
      {flipped && (
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => next(false)}>
            La repaso
          </button>
          <button type="button" className="btn" onClick={() => next(true)}>
            La sé
          </button>
        </div>
      )}
    </section>
  )
}

function PhraseAbc({
  phrases,
  onResult,
}: {
  phrases: Phrase[]
  onResult: (id: string, ok: boolean) => void
}) {
  const [queue, setQueue] = useState(() => shuffle(phrases))
  const [picked, setPicked] = useState<string | null>(null)
  const current = queue[0]
  const options = useMemo(() => {
    if (!current) return []
    const others = shuffle(phrases.filter((p) => p.id !== current.id)).slice(0, 2)
    return shuffle([current, ...others])
  }, [current, phrases])

  if (!current) return <p className="muted">Listo por ahora.</p>

  const choose = (opt: Phrase) => {
    if (picked) return
    const ok = opt.id === current.id
    setPicked(opt.id)
    onResult(current.id, ok)
    window.setTimeout(() => {
      setPicked(null)
      setQueue((q) => shuffle(q.slice(1).concat(ok ? [] : [current])))
    }, 650)
  }

  return (
    <section className="quiz">
      <p className="big-prompt phrase">{current.es}</p>
      <div className="choices">
        {options.map((opt, idx) => {
          let cls = 'choice'
          if (picked) {
            if (opt.id === current.id) cls += ' good'
            else if (opt.id === picked) cls += ' bad'
          }
          return (
            <button
              key={opt.id}
              type="button"
              className={cls}
              disabled={Boolean(picked)}
              onClick={() => choose(opt)}
            >
              <span className="letter">{'ABC'[idx]}</span>
              {opt.it}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function PhraseWrite({
  phrases,
  ignoreAccents,
  onResult,
}: {
  phrases: Phrase[]
  ignoreAccents: boolean
  onResult: (id: string, ok: boolean) => void
}) {
  const [queue, setQueue] = useState(() => shuffle(phrases))
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const current = queue[0]

  useEffect(() => {
    setValue('')
    setFeedback(null)
  }, [current?.id])

  if (!current) return <p className="muted">Listo por ahora.</p>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (feedback) return
    const ok = answersMatch(value, current.it, ignoreAccents)
    setFeedback(ok ? 'ok' : 'bad')
    onResult(current.id, ok)
    window.setTimeout(() => {
      setQueue((q) => shuffle(q.slice(1).concat(ok ? [] : [current])))
    }, 1000)
  }

  return (
    <section className="quiz">
      <p className="big-prompt phrase">{current.es}</p>
      <form onSubmit={submit} className="stack">
        <input
          className={`input ${feedback === 'ok' ? 'ok' : feedback === 'bad' ? 'bad' : ''}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="frase en italiano…"
        />
        {feedback === 'bad' && (
          <p className="answer-reveal">Era: <strong>{current.it}</strong></p>
        )}
        <button className="btn" type="submit" disabled={Boolean(feedback)}>
          Comprobar
        </button>
      </form>
    </section>
  )
}
