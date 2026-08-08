import Dexie, { type Table } from 'dexie'
import type { ItemProgress, ProgressStatus, Settings } from './types'
import { DEFAULT_UNLOCK } from './types'

export type MetaRow = {
  key: string
  value: unknown
}

class ItalianoDB extends Dexie {
  wordProgress!: Table<ItemProgress, string>
  phraseProgress!: Table<ItemProgress, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('italiano-local')
    this.version(1).stores({
      wordProgress: 'id, status, updatedAt',
      phraseProgress: 'id, status, updatedAt',
      meta: 'key',
    })
  }
}

export const db = new ItalianoDB()

const DEFAULT_SETTINGS: Settings = {
  ignoreAccents: true,
  unlockThreshold: DEFAULT_UNLOCK,
}

export async function getSettings(): Promise<Settings> {
  const row = await db.meta.get('settings')
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.meta.put({ key: 'settings', value: settings })
}

function statusAfter(prev: ItemProgress | undefined, ok: boolean): ProgressStatus {
  const correct = (prev?.correct ?? 0) + (ok ? 1 : 0)
  const wrong = (prev?.wrong ?? 0) + (ok ? 0 : 1)
  if (ok && correct >= 3 && correct >= wrong) return 'known'
  if (!prev || prev.status === 'new') return 'learning'
  if (!ok && prev.status === 'known') return 'learning'
  return prev.status === 'known' ? 'known' : 'learning'
}

export async function recordWordResult(wordId: string, ok: boolean) {
  const prev = await db.wordProgress.get(wordId)
  const row: ItemProgress = {
    id: wordId,
    status: statusAfter(prev, ok),
    correct: (prev?.correct ?? 0) + (ok ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
    updatedAt: Date.now(),
  }
  await db.wordProgress.put(row)
  return row
}

export async function recordPhraseResult(phraseId: string, ok: boolean) {
  const prev = await db.phraseProgress.get(phraseId)
  const correct = (prev?.correct ?? 0) + (ok ? 1 : 0)
  const wrong = (prev?.wrong ?? 0) + (ok ? 0 : 1)
  const row: ItemProgress = {
    id: phraseId,
    status: ok && correct >= 2 ? 'known' : 'learning',
    correct,
    wrong,
    updatedAt: Date.now(),
  }
  await db.phraseProgress.put(row)
  return row
}

export async function getAllWordProgress(): Promise<Map<string, ItemProgress>> {
  const rows = await db.wordProgress.toArray()
  return new Map(rows.map((r) => [r.id, r]))
}

export async function getAllPhraseProgress(): Promise<Map<string, ItemProgress>> {
  const rows = await db.phraseProgress.toArray()
  return new Map(rows.map((r) => [r.id, r]))
}

export async function resetPackProgress(wordIds: string[], phraseIds: string[]) {
  await db.transaction('rw', db.wordProgress, db.phraseProgress, async () => {
    await db.wordProgress.bulkDelete(wordIds)
    await db.phraseProgress.bulkDelete(phraseIds)
  })
}

export async function exportBackup() {
  const [wordProgress, phraseProgress, settings] = await Promise.all([
    db.wordProgress.toArray(),
    db.phraseProgress.toArray(),
    getSettings(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    wordProgress,
    phraseProgress,
  }
}

export async function importBackup(data: {
  settings?: Settings
  wordProgress?: ItemProgress[]
  phraseProgress?: ItemProgress[]
}) {
  await db.transaction('rw', db.wordProgress, db.phraseProgress, db.meta, async () => {
    if (data.settings) await saveSettings(data.settings)
    if (data.wordProgress?.length) {
      await db.wordProgress.clear()
      await db.wordProgress.bulkPut(data.wordProgress)
    }
    if (data.phraseProgress?.length) {
      await db.phraseProgress.clear()
      await db.phraseProgress.bulkPut(data.phraseProgress)
    }
  })
}
