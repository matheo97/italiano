import type { ItemProgress, Word } from './types'
import { PACK_COUNT, PACK_SIZE } from './types'
import { words } from './catalog'

export type PackStats = {
  pack: number
  total: number
  known: number
  learning: number
  ratio: number
  unlocked: boolean
}

export function statsForPack(
  pack: number,
  progress: Map<string, ItemProgress>,
): Omit<PackStats, 'unlocked'> {
  const start = pack * PACK_SIZE
  const slice = words.slice(start, start + PACK_SIZE)
  let known = 0
  let learning = 0
  for (const w of slice) {
    const p = progress.get(w.id)
    if (p?.status === 'known') known++
    else if (p?.status === 'learning') learning++
  }
  return {
    pack,
    total: slice.length,
    known,
    learning,
    ratio: slice.length ? known / slice.length : 0,
  }
}

export function computePackStats(
  progress: Map<string, ItemProgress>,
  unlockThreshold: number,
): PackStats[] {
  const base = Array.from({ length: PACK_COUNT }, (_, pack) =>
    statsForPack(pack, progress),
  )
  return base.map((s, i) => {
    if (i === 0) return { ...s, unlocked: true }
    const prev = base[i - 1]
    return { ...s, unlocked: prev.ratio >= unlockThreshold }
  })
}

export function currentPackIndex(stats: PackStats[]): number {
  let cur = 0
  for (const s of stats) {
    if (s.unlocked) cur = s.pack
    if (s.unlocked && s.ratio < 1) return s.pack
  }
  return cur
}

export function globalKnown(progress: Map<string, ItemProgress>, list: Word[]): number {
  let n = 0
  for (const w of list) {
    if (progress.get(w.id)?.status === 'known') n++
  }
  return n
}
