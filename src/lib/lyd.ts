// ---------------------------------------------------------------------------
// Lydeffekter. Filerne ligger i public/lyd/. Kan slås fra (gemmes lokalt).
// ---------------------------------------------------------------------------
export type Lyd = 'polly' | 'guld' | 'sejr'

const KEY = 'kaptajn-tal-lyd'
const FILER: Record<Lyd, string> = { polly: '/lyd/polly.mp3', guld: '/lyd/guld.mp3', sejr: '/lyd/sejr.mp3' }
const cache = new Map<Lyd, HTMLAudioElement>()

export function lydTil(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'fra'
  } catch {
    return true
  }
}

export function saetLyd(til: boolean) {
  try {
    localStorage.setItem(KEY, til ? 'til' : 'fra')
  } catch {
    /* ignorer */
  }
}

/** Afspil en lyd (kaldes fra et klik/tastetryk, så mobil-browsere tillader det). */
export function afspil(navn: Lyd) {
  if (!lydTil()) return
  try {
    let a = cache.get(navn)
    if (!a) {
      a = new Audio(FILER[navn])
      a.preload = 'auto'
      cache.set(navn, a)
    }
    a.currentTime = 0
    void a.play().catch(() => {})
  } catch {
    /* ingen lyd – fint */
  }
}

/** Varm lydene op ved første berøring, så den første afspilning ikke halter. */
export function forbered() {
  for (const navn of Object.keys(FILER) as Lyd[]) {
    if (!cache.has(navn)) {
      const a = new Audio(FILER[navn])
      a.preload = 'auto'
      cache.set(navn, a)
    }
  }
}
