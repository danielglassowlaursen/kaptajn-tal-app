import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Gravested, Progress } from './types'
import { findTogt } from './data/togter'
import { erTom, loadProgress, saveProgress, TOM_PROGRESS } from './lib/progress'
import { begrav, bogfoer, evaluerDage, tilfoejTid, type Resultat } from './lib/spil'
import { dagKey } from './lib/dato'
import { gemCloud, gendanFraHistorik, getKode, hentCloud, setKode as gemKodeLokalt, type SyncState } from './lib/sync'
import { Home } from './components/Home'
import { Skat } from './components/Skat'
import { Besaetning } from './components/Besaetning'
import { Oversigt } from './components/Oversigt'
import { TopMenu, type MenuKey } from './components/TopMenu'
import { TogtView } from './components/TogtView'
import { Begrav } from './components/Begrav'
import { Toasts, type ToastItem } from './components/Toast'
import { FamilieKode, type ForbindResultat } from './components/FamilieKode'
import { Footer } from './components/Footer'
import { KonfettiLag } from './components/Konfetti'
import { afspil, forbered, lydTil, saetLyd } from './lib/lyd'
import { fest } from './lib/fest'

type Screen =
  | { kind: 'home' }
  | { kind: 'skat' }
  | { kind: 'crew' }
  | { kind: 'oversigt'; togtId?: string }
  | { kind: 'togt'; togtId: string; startIndex: number; skipIntro?: boolean }
  | { kind: 'begrav' }

/** Udvikler-genvej: ?togt=togt2&i=13 åbner opgave 13 i togt 2 direkte. */
function screenFromUrl(): Screen {
  const q = new URLSearchParams(window.location.search)
  const togtId = q.get('togt')
  if (!togtId || !findTogt(togtId)) return { kind: 'home' }
  const i = Math.max(1, Number(q.get('i') ?? '1')) - 1
  return { kind: 'togt', togtId, startIndex: i, skipIntro: true }
}

/** Vigtige ændringer (svar, begravelse, navn) synkes efter 1,5 s – tidstikkene samles op hvert 15. s. */
const SYNC_HASTER_MS = 1500
const SYNC_ROLIG_MS = 15000

let toastId = 1

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [screen, setScreen] = useState<Screen>(() => screenFromUrl())
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [iDag, setIDag] = useState(() => dagKey())
  const [kode, setKodeState] = useState<string | null>(() => getKode())
  const [sync, setSync] = useState<SyncState>(() => (getKode() ? { status: 'syncing' } : { status: 'off' }))
  const [klar, setKlar] = useState(false)
  const [genindlaeser, setGenindlaeser] = useState(false)
  const [lyd, setLyd] = useState(() => lydTil())

  // Seneste værdier i refs, så tidstæller, timere og event-handlere aldrig arbejder på en gammel kopi.
  const ref = useRef(progress)
  ref.current = progress
  const kodeRef = useRef(kode)
  kodeRef.current = kode
  const timer = useRef<number | null>(null)
  const pending = useRef<Progress | null>(null)

  const addToasts = useCallback((texts: string[]) => {
    if (texts.length === 0) return
    setToasts((prev) => [...prev, ...texts.map((text) => ({ id: toastId++, text }))])
  }, [])
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  /** Gem i state + localStorage uden at røre synk. */
  function saet(p: Progress) {
    ref.current = p
    setProgress(p)
    saveProgress(p)
  }

  /** Normal ændring: stempler tid, gemmer lokalt og planlægger synk. */
  function update(p: Progress, haster = true) {
    const stemplet = { ...p, updatedAt: Date.now() }
    saet(stemplet)
    planlaegSync(stemplet, haster)
  }

  function planlaegSync(p: Progress, haster: boolean) {
    if (!kodeRef.current) return
    pending.current = p
    if (timer.current !== null) {
      if (!haster) return
      window.clearTimeout(timer.current)
    }
    timer.current = window.setTimeout(() => void flush(), haster ? SYNC_HASTER_MS : SYNC_ROLIG_MS)
  }

  async function flush(keepalive = false): Promise<void> {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    const k = kodeRef.current
    const p = pending.current
    if (!k || !p) return
    pending.current = null
    setSync({ status: 'syncing' })
    const r = await gemCloud(k, p, keepalive)
    if (r.status === 'ok') {
      setSync({ status: 'ok', sidst: Date.now() })
    } else if (r.status === 'nyere') {
      saet(r.progress)
      setSync({ status: 'ok', sidst: Date.now() })
      addToasts(['☁️ Hentede nyere fremgang fra en anden enhed.'])
    } else {
      if (!pending.current) pending.current = p // prøv igen ved næste ændring
      setSync({ status: 'fejl', besked: r.besked })
    }
  }

  // Ved start: hent skyens version, hvis den er nyere – ellers send vores op.
  useEffect(() => {
    let aktiv = true
    ;(async () => {
      const k = kodeRef.current
      if (k) {
        const r = await hentCloud(k)
        if (!aktiv) return
        if (r.status === 'fundet') {
          if (r.progress.updatedAt > ref.current.updatedAt) saet(r.progress)
          else if (r.progress.updatedAt < ref.current.updatedAt) planlaegSync(ref.current, true)
          setSync({ status: 'ok', sidst: Date.now() })
        } else if (r.status === 'tom') {
          if (!erTom(ref.current)) planlaegSync(ref.current, true)
          setSync({ status: 'ok', sidst: Date.now() })
        } else {
          setSync({ status: 'fejl', besked: r.besked })
        }
      }
      setKlar(true)
    })()
    return () => {
      aktiv = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Når skyen er tjekket (og når dagen skifter): glemte dage koster besætning.
  useEffect(() => {
    if (!klar) return
    const r = evaluerDage(ref.current, iDag)
    if (r.p !== ref.current) update(r.p)
    addToasts(r.events)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klar, iDag])

  // Send det sidste op, når fanen skjules eller lukkes.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush(true)
    }
    const onPageHide = () => void flush(true)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tick(sek: number) {
    const dag = dagKey()
    if (dag !== iDag) setIDag(dag)
    const r = tilfoejTid(ref.current, sek, dag)
    update(r.p, r.events.length > 0)
    addToasts(r.events)
    if (r.events.length > 0) {
      fest('stor')
      afspil('guld')
    }
  }

  // Varm lydene op ved første berøring (mobil-browsere kræver en brugerhandling).
  useEffect(() => {
    const onFirst = () => forbered()
    window.addEventListener('pointerdown', onFirst, { once: true })
    return () => window.removeEventListener('pointerdown', onFirst)
  }, [])

  function skiftLyd() {
    const ny = !lyd
    saetLyd(ny)
    setLyd(ny)
    if (ny) afspil('guld')
  }

  function resultat(togtId: string, opgaveId: string, r: Resultat) {
    const b = bogfoer(ref.current, togtId, opgaveId, r)
    update(b.p)
    return { guld: b.guld, tyveri: b.tyveri }
  }

  function begravNu(sted: Gravested) {
    update(begrav(ref.current, sted))
  }

  // ------------------------------------------------------------ familiekode
  function aktiverKode(k: string | null) {
    gemKodeLokalt(k)
    kodeRef.current = k
    setKodeState(k)
    setSync(k ? { status: 'syncing' } : { status: 'off' })
  }

  async function forbind(k: string): Promise<ForbindResultat> {
    const r = await hentCloud(k)
    if (r.status === 'fejl') return { status: 'fejl', besked: r.besked }
    if (r.status === 'tom') {
      aktiverKode(k)
      update({ ...ref.current }) // nyt stempel → sendes op
      return { status: 'oprettet' }
    }
    if (erTom(ref.current)) {
      aktiverKode(k)
      saet(r.progress)
      setSync({ status: 'ok', sidst: Date.now() })
      return { status: 'hentet' }
    }
    return { status: 'konflikt', cloud: r.progress }
  }

  function loes(valg: 'hent' | 'behold', k: string, cloud: Progress) {
    aktiverKode(k)
    if (valg === 'hent') {
      saet(cloud)
      setSync({ status: 'ok', sidst: Date.now() })
    } else {
      update({ ...ref.current }) // nyt stempel vinder over skyens
    }
  }

  function afbryd() {
    void flush()
    aktiverKode(null)
  }

  // ------------------------------------------------------------ sikkerhedskopi
  function eksporter() {
    const p = ref.current
    const navn = (p.name || 'kaptajn').toLowerCase().replace(/[^a-zæøå0-9]+/g, '-')
    const indhold = JSON.stringify({ app: 'kaptajn-tal', version: 1, eksporteret: new Date().toISOString(), progress: p }, null, 2)
    const blob = new Blob([indhold], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `kaptajn-tal-${navn}-${dagKey()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  function importer(p: Progress) {
    update({ ...TOM_PROGRESS, ...p }) // nyt stempel → vinder i skyen
    addToasts(['📂 Kopien er hentet ind.'])
  }

  async function gendan(id: number): Promise<string | null> {
    const k = kodeRef.current
    if (!k) return 'Ingen familiekode'
    const r = await gendanFraHistorik(k, id)
    if (r.status !== 'ok') return r.besked
    pending.current = null
    saet(r.progress)
    setSync({ status: 'ok', sidst: Date.now() })
    addToasts(['🕘 Skatten er gendannet.'])
    return null
  }

  async function genindlaes() {
    setGenindlaeser(true)
    await flush()
    window.location.reload()
  }

  // ------------------------------------------------------------ render
  const active: MenuKey | null =
    screen.kind === 'home' || screen.kind === 'togt'
      ? 'home'
      : screen.kind === 'skat' || screen.kind === 'begrav'
        ? 'skat'
        : screen.kind === 'oversigt'
          ? 'oversigt'
          : 'crew'

  const kodeKort: ReactNode = (
    <FamilieKode kode={kode} sync={sync} onForbind={forbind} onLoes={loes} onAfbryd={afbryd} onEksport={eksporter} onImport={importer} onGendan={gendan} />
  )

  let content
  if (screen.kind === 'togt' && findTogt(screen.togtId)) {
    const togt = findTogt(screen.togtId)!
    content = (
      <TogtView
        key={togt.id}
        togt={togt}
        progress={progress}
        startIndex={screen.startIndex}
        skipIntro={screen.skipIntro}
        iDag={iDag}
        onResultat={(opgaveId, r) => resultat(togt.id, opgaveId, r)}
        onTick={tick}
        onBegrav={() => setScreen({ kind: 'begrav' })}
        onOversigt={() => setScreen({ kind: 'oversigt', togtId: togt.id })}
        onExit={() => setScreen({ kind: 'home' })}
      />
    )
  } else if (screen.kind === 'oversigt') {
    content = <Oversigt progress={progress} fokus={screen.togtId} onStart={(togtId, startIndex) => setScreen({ kind: 'togt', togtId, startIndex })} />
  } else if (screen.kind === 'begrav') {
    content = <Begrav pung={progress.pung} onTick={tick} onBegrav={begravNu} onExit={() => setScreen({ kind: 'home' })} />
  } else if (screen.kind === 'skat') {
    content = <Skat progress={progress} onBegrav={() => setScreen({ kind: 'begrav' })} />
  } else if (screen.kind === 'crew') {
    content = <Besaetning progress={progress} iDag={iDag} />
  } else {
    content = (
      <Home
        progress={progress}
        kodeKort={kodeKort}
        onName={(name) => update({ ...progress, name })}
        onStart={(togtId, startIndex) => setScreen({ kind: 'togt', togtId, startIndex })}
        onOversigt={(togtId) => setScreen({ kind: 'oversigt', togtId })}
      />
    )
  }

  return (
    <>
      <TopMenu active={active} progress={progress} onNav={(k) => setScreen({ kind: k })} />
      {content}
      <Footer onRefresh={() => void genindlaes()} travl={genindlaeser} lyd={lyd} onLyd={skiftLyd} />
      <Toasts items={toasts} onDone={removeToast} />
      <KonfettiLag />
    </>
  )
}
