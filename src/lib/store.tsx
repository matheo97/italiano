import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  exportBackup,
  getAllPhraseProgress,
  getAllWordProgress,
  getSettings,
  importBackup,
  recordPhraseResult,
  recordWordResult,
  resetPackProgress,
  saveSettings,
} from './db'
import type { ItemProgress, Settings } from './types'
import { computePackStats, currentPackIndex } from './progress'
import { phrasesForPack, wordsForPack } from './catalog'

type AppState = {
  ready: boolean
  settings: Settings
  wordProgress: Map<string, ItemProgress>
  phraseProgress: Map<string, ItemProgress>
  refresh: () => Promise<void>
  setSettings: (s: Settings) => Promise<void>
  markWord: (id: string, ok: boolean) => Promise<void>
  markPhrase: (id: string, ok: boolean) => Promise<void>
  resetPack: (pack: number) => Promise<void>
  doExport: () => Promise<string>
  doImport: (json: string) => Promise<void>
  packStats: ReturnType<typeof computePackStats>
  activePack: number
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [settings, setSettingsState] = useState<Settings>({
    ignoreAccents: true,
    unlockThreshold: 0.8,
  })
  const [wordProgress, setWordProgress] = useState<Map<string, ItemProgress>>(
    new Map(),
  )
  const [phraseProgress, setPhraseProgress] = useState<
    Map<string, ItemProgress>
  >(new Map())

  const refresh = useCallback(async () => {
    const [s, wp, pp] = await Promise.all([
      getSettings(),
      getAllWordProgress(),
      getAllPhraseProgress(),
    ])
    setSettingsState(s)
    setWordProgress(wp)
    setPhraseProgress(pp)
    setReady(true)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setSettings = async (s: Settings) => {
    await saveSettings(s)
    setSettingsState(s)
  }

  const markWord = async (id: string, ok: boolean) => {
    const row = await recordWordResult(id, ok)
    setWordProgress((prev) => new Map(prev).set(id, row))
  }

  const markPhrase = async (id: string, ok: boolean) => {
    const row = await recordPhraseResult(id, ok)
    setPhraseProgress((prev) => new Map(prev).set(id, row))
  }

  const resetPack = async (pack: number) => {
    const wids = wordsForPack(pack).map((w) => w.id)
    const pids = phrasesForPack(pack).map((p) => p.id)
    await resetPackProgress(wids, pids)
    await refresh()
  }

  const doExport = async () => JSON.stringify(await exportBackup(), null, 2)

  const doImport = async (json: string) => {
    const data = JSON.parse(json) as Awaited<ReturnType<typeof exportBackup>>
    await importBackup(data)
    await refresh()
  }

  const packStats = computePackStats(wordProgress, settings.unlockThreshold)
  const activePack = currentPackIndex(packStats)

  return (
    <Ctx.Provider
      value={{
        ready,
        settings,
        wordProgress,
        phraseProgress,
        refresh,
        setSettings,
        markWord,
        markPhrase,
        resetPack,
        doExport,
        doImport,
        packStats,
        activePack,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside provider')
  return ctx
}
