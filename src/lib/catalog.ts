import type { Phrase, Word } from './types'
import { PACK_SIZE } from './types'
import wordsData from '../data/words.json'
import phrasesData from '../data/phrases.json'

export const words = wordsData as Word[]
export const phrases = phrasesData as Phrase[]

export function packIndexForRank(rank: number): number {
  return Math.floor((rank - 1) / PACK_SIZE)
}

export function wordsForPack(pack: number): Word[] {
  const start = pack * PACK_SIZE
  return words.slice(start, start + PACK_SIZE)
}

export function phrasesForPack(pack: number): Phrase[] {
  return phrases.filter((p) => p.pack === pack)
}

export function packLabel(pack: number): string {
  const from = pack * PACK_SIZE + 1
  const to = (pack + 1) * PACK_SIZE
  return `${from}–${to}`
}

export function normalizeAnswer(raw: string, ignoreAccents: boolean): string {
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  // strip trailing punctuation common in phrases
  s = s.replace(/[.!?…]+$/g, '').trim()
  if (ignoreAccents) {
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
  return s
}

export function answersMatch(
  user: string,
  expected: string,
  ignoreAccents: boolean,
): boolean {
  const a = normalizeAnswer(user, ignoreAccents)
  const b = normalizeAnswer(expected, ignoreAccents)
  if (a === b) return true
  // accept first alternative before " / "
  const alts = expected.split('/').map((p) => normalizeAnswer(p, ignoreAccents))
  return alts.includes(a)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickDistractors(
  correct: Word,
  pool: Word[],
  n = 2,
): Word[] {
  const others = shuffle(pool.filter((w) => w.id !== correct.id))
  return others.slice(0, n)
}
