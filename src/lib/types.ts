export type Word = {
  id: string
  rank: number
  it: string
  es: string
  pos?: string
}

export type Phrase = {
  id: string
  pack: number
  it: string
  es: string
}

export type ProgressStatus = 'new' | 'learning' | 'known'

export type ItemProgress = {
  id: string
  status: ProgressStatus
  correct: number
  wrong: number
  updatedAt: number
}

export type Settings = {
  ignoreAccents: boolean
  unlockThreshold: number
}

export type StudyMode = 'cards' | 'abc' | 'write' | 'phrases'

export const PACK_SIZE = 100
export const PACK_COUNT = 50
export const DEFAULT_UNLOCK = 0.8
