/**
 * Build src/data/words.json from FrequencyWords IT list + MyMemory IT→ES.
 * Usage: node scripts/build-words.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const cachePath = join(__dirname, '.translate-cache.json')
const outPath = join(root, 'src/data/words.json')
const freqPath = process.env.FREQ_PATH || '/tmp/it_50k.txt'
const LIMIT = Number(process.env.LIMIT || 5000)
const CONCURRENCY = 4
const DELAY_MS = 120

const OVERRIDES = {
  e: 'y',
  non: 'no / no (negación)',
  che: 'que',
  di: 'de',
  la: 'la',
  il: 'el',
  un: 'un',
  una: 'una',
  a: 'a / hacia',
  per: 'para / por',
  in: 'en',
  è: 'es / está',
  mi: 'me / mi',
  si: 'sí / se',
  ho: 'tengo',
  hai: 'tienes',
  ha: 'tiene',
  hanno: 'tienen',
  sono: 'soy / son / estoy',
  sei: 'eres / estás',
  siamo: 'somos / estamos',
  siete: 'sois / estánis',
  io: 'yo',
  tu: 'tú',
  lui: 'él',
  lei: 'ella / usted',
  noi: 'nosotros',
  voi: 'vosotros / ustedes',
  loro: 'ellos / ellas',
  con: 'con',
  ma: 'pero',
  se: 'si',
  come: 'como / cómo',
  più: 'más',
  anche: 'también',
  questo: 'este',
  questa: 'esta',
  quello: 'ese / aquel',
  quella: 'esa / aquella',
  qui: 'aquí',
  lì: 'allí',
  dove: 'dónde / donde',
  quando: 'cuándo / cuando',
  perché: 'porque / por qué',
  cosa: 'cosa / qué',
  ciao: 'hola / adiós',
  grazie: 'gracias',
  prego: 'de nada / por favor',
  sì: 'sí',
  no: 'no',
  bene: 'bien',
  male: 'mal',
  oggi: 'hoy',
  domani: 'mañana',
  ieri: 'ayer',
  ora: 'ahora / hora',
  tempo: 'tiempo / clima',
  uomo: 'hombre',
  donna: 'mujer',
  bambino: 'niño',
  casa: 'casa',
  giorno: 'día',
  notte: 'noche',
  anno: 'año',
  volta: 'vez',
  vita: 'vida',
  mondo: 'mundo',
  paese: 'país / pueblo',
  città: 'ciudad',
  lavoro: 'trabajo',
  amico: 'amigo',
  amore: 'amor',
  famiglia: 'familia',
  cibo: 'comida',
  acqua: 'agua',
  vino: 'vino',
  pane: 'pan',
  caffè: 'café',
  libro: 'libro',
  scuola: 'escuela',
  macchina: 'coche / máquina',
  treno: 'tren',
  aereo: 'avión',
  mare: 'mar',
  sole: 'sol',
  luna: 'luna',
  strada: 'calle / camino',
  grande: 'grande',
  piccolo: 'pequeño',
  bello: 'bonito / hermoso',
  brutto: 'feo',
  buono: 'bueno',
  cattivo: 'malo',
  nuovo: 'nuevo',
  vecchio: 'viejo',
  giovane: 'joven',
  alto: 'alto',
  basso: 'bajo',
  lungo: 'largo',
  corto: 'corto',
  caldo: 'caliente / calor',
  freddo: 'frío',
  facile: 'fácil',
  difficile: 'difícil',
  andare: 'ir',
  venire: 'venir',
  fare: 'hacer',
  dire: 'decir',
  potere: 'poder',
  volere: 'querer',
  dovere: 'deber',
  sapere: 'saber',
  vedere: 'ver',
  dare: 'dar',
  prendere: 'tomar / coger',
  mettere: 'poner',
  stare: 'estar / quedarse',
  avere: 'tener',
  essere: 'ser / estar',
  parlare: 'hablar',
  mangiare: 'comer',
  bere: 'beber',
  dormire: 'dormir',
  capire: 'entender',
  pensare: 'pensar',
  trovare: 'encontrar',
  lasciare: 'dejar',
  sentire: 'sentir / oír',
  guardare: 'mirar',
  aspettare: 'esperar',
  arrivare: 'llegar',
  partire: 'partir / salir',
  vivere: 'vivir',
  morire: 'morir',
  comprare: 'comprar',
  vendere: 'vender',
  aprire: 'abrir',
  chiudere: 'cerrar',
  scrivere: 'escribir',
  leggere: 'leer',
  chiamare: 'llamar',
  chiedere: 'pedir / preguntar',
  rispondere: 'responder',
  portare: 'llevar / traer',
  portare: 'llevar',
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function loadCache() {
  if (!existsSync(cachePath)) return {}
  return JSON.parse(readFileSync(cachePath, 'utf8'))
}

function saveCache(cache) {
  writeFileSync(cachePath, JSON.stringify(cache))
}

async function translate(word, cache) {
  const key = word.toLowerCase()
  if (OVERRIDES[key]) return OVERRIDES[key]
  if (cache[key]) return cache[key]
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=it|es`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${word}`)
  const data = await res.json()
  let text = data?.responseData?.translatedText?.trim() || word
  if (data.quotaFinished) {
    console.warn('Quota finished; using passthrough for remaining')
    text = word
  }
  // Avoid useless full-sentence garbage / same-as-query only if empty
  if (!text) text = word
  cache[key] = text
  return text
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()))
  return out
}

async function main() {
  const raw = readFileSync(freqPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/)[0])
    .filter((w) => /^[a-zàèéìíîòóùúA-ZÀÈÉÌÍÎÒÓÙÚ'\-]+$/.test(w))

  const seen = new Set()
  const words = []
  for (const w of raw) {
    const lower = w.toLowerCase()
    if (seen.has(lower)) continue
    // skip very short punctuation-like tokens except useful ones
    if (lower.length === 1 && !['e', 'a', 'i', 'o', 'è'].includes(lower)) continue
    seen.add(lower)
    words.push(lower)
    if (words.length >= LIMIT) break
  }

  console.log(`Translating ${words.length} words…`)
  const cache = loadCache()
  let done = 0
  const translations = await mapPool(words, CONCURRENCY, async (w) => {
    const es = await translate(w, cache)
    done++
    if (done % 50 === 0) {
      saveCache(cache)
      console.log(`  ${done}/${words.length}`)
    }
    await sleep(DELAY_MS)
    return es
  })
  saveCache(cache)

  const list = words.map((it, i) => ({
    id: `w${String(i + 1).padStart(4, '0')}`,
    rank: i + 1,
    it,
    es: translations[i],
  }))

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(list))
  console.log(`Wrote ${list.length} words → ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
