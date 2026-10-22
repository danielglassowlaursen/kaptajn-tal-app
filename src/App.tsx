import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Gravested, Progress, Togt } from './types'
import { DEMO_IDS, demoTogter } from './data/togter'
import { hentTema, TemaProvider, type TemaId } from './tema'
import { flet, loadTogter, nytTogtId, saveTogter, synlige, type GemtTogt, type TogtLager } from './lib/togtStore'
import { downloadFil, filnavn, parseTogtFil, togtTilFil } from './lib/togtFil'
import { komprimer } from './lib/billede'
import { MineTogter } from './components/MineTogter'
import { Scan } from './components/Scan'
import { Velkommen } from './components/Velkommen'
import { loadAi, saveAi, type AiIndstillinger } from './lib/ai'
import { erTom, loadProgress, saveProgress, TOM_PROGRESS } from './lib/progress'
import { aabnOpgaver, begrav, bogfoer, bogfoerTraening, evaluerDage, rapporterFacit, startTraening, tilfoejTid, type Resultat } from './lib/spil'
import { lavTraening, traeningsStatus, TRAENING_ID } from './lib/traening'
import { Gennemse } from './components/Gennemse'
import { answerText } from './lib/check'
import { dagKey } from './lib/dato'
import {
  arkUrl,
  gemCloud,
  gemTogtCloud,
  gendanFraHistorik,
  getKode,
  hentCloud,
  hentTogterCloud,
  setKode as gemKodeLokalt,
  sletArk,
  uploadArk,
  type SyncState,
} from './lib/sync'
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
  | { kind: 'scan' }
  | { kind: 'ret'; togtId: string }
  | { kind: 'traening' }

/** Udvikler-genvej: ?togt=togt2&i=13 åbner opgave 13 i togt 2 direkte. */
function screenFromUrl(): Screen {
  const q = new URLSearchParams(window.location.search)
  const togtId = q.get('togt')
  if (!togtId || !(DEMO_IDS.has(togtId) || togtId in loadTogter())) return { kind: 'home' }
  const i = Math.max(1, Number(q.get('i') ?? '1')) - 1
  return { kind: 'togt', togtId, startIndex: i, skipIntro: true }
}

/** Vigtige ændringer (svar, begravelse, navn) synkes efter 1,5 s – tidstikkene samles op hvert 15. s. */
const SYNC_HASTER_MS = 1500
const SYNC_ROLIG_MS = 15000

let toastId = 1
const VELKOMMEN_KEY = 'kaptajn-tal-velkommen-v1'

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
  const [lager, setLager] = useState<TogtLager>(() => loadTogter())
  // Træningsomgangen bygges én gang ved start, så den ikke ændrer sig, mens barnet svarer.
  const [traeningTogt, setTraeningTogt] = useState<Togt | null>(null)
  const [ai, setAi] = useState<AiIndstillinger>(() => loadAi())
  // Velkomstguiden vises første gang på en tom enhed uden familiekode.
  const [velkommen, setVelkommen] = useState(() => {
    try {
      return !localStorage.getItem(VELKOMMEN_KEY) && !getKode() && erTom(loadProgress()) && !new URLSearchParams(location.search).get('togt')
    } catch {
      return false
    }
  })
  const tema = hentTema(progress.tema)
  const temaRef = useRef(tema)
  temaRef.current = tema

  // Temaets farver og skrift styres af CSS ud fra data-tema på <html>.
  useEffect(() => {
    document.documentElement.dataset.tema = tema.id
  }, [tema.id])
  const lagerRef = useRef(lager)
  lagerRef.current = lager

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

  // ------------------------------------------------------------ togter
  function saetLager(l: TogtLager) {
    lagerRef.current = l
    setLager(l)
    saveTogter(l)
  }

  /** Gem ét togt lokalt og send det op, hvis der er en familiekode. */
  async function gemTogt(g: GemtTogt) {
    saetLager({ ...lagerRef.current, [g.togt.id]: g })
    const k = kodeRef.current
    if (!k) return
    const r = await gemTogtCloud(k, g)
    if (r.status === 'nyere') saetLager({ ...lagerRef.current, [r.gemt.togt.id]: r.gemt })
  }

  /** Hent togter fra skyen og flet dem med de lokale. */
  async function synkTogter(k: string) {
    const r = await hentTogterCloud(k)
    if (r.status !== 'ok') return
    const { lager: nyt, skalOp } = flet(lagerRef.current, r.togter)
    saetLager(nyt)
    for (const g of skalOp) void gemTogtCloud(k, g)
  }

  // Ved start: hent skyens version, hvis den er nyere – ellers send vores op.
  useEffect(() => {
    let aktiv = true
    ;(async () => {
      const k = kodeRef.current
      if (k) {
        void synkTogter(k)
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
    const r = evaluerDage(ref.current, iDag, temaRef.current)
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
    const r = tilfoejTid(ref.current, sek, dag, temaRef.current)
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
    if (togtId === TRAENING_ID) {
      const b = bogfoerTraening(ref.current, r, temaRef.current)
      update(b.p)
      return { guld: b.guld, tyveri: b.tyveri }
    }
    const b = bogfoer(ref.current, togtId, opgaveId, r, temaRef.current)
    update(b.p)
    return { guld: b.guld, tyveri: b.tyveri }
  }

  function rapport(togtId: string, opgaveId: string): number {
    const r = rapporterFacit(ref.current, togtId, opgaveId)
    update(r.p)
    return r.tilbage
  }

  /** Gem et rettet togt. Opgaver med ændret facit eller en melding fra barnet åbnes igen. */
  function gemRettet(ny: Togt) {
    const g = lagerRef.current[ny.id]
    if (!g) return
    const foer = new Map(g.togt.opgaver.map((o) => [o.id, answerText(o)]))
    const svar = ref.current.togter[ny.id]?.svar ?? {}
    const aabn = ny.opgaver.filter((o) => foer.get(o.id) !== answerText(o) || svar[o.id]?.rapport).map((o) => o.id)
    void gemTogt({ ...g, togt: { ...ny, ark: ny.ark ? { ...g.togt.ark, ...ny.ark } : g.togt.ark }, updatedAt: Date.now() })
    if (aabn.length) update(aabnOpgaver(ref.current, ny.id, aabn))
    setScreen({ kind: 'home' })
    addToasts([`✏️ "${ny.title}" er rettet.${aabn.length ? ` ${aabn.length} opgave${aabn.length === 1 ? '' : 'r'} kan løses igen.` : ''}`])
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
    void synkTogter(k)
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
    const egneTogter = Object.values(lagerRef.current).filter((g) => !g.slettet)
    const indhold = JSON.stringify({ app: 'kaptajn-tal', version: 2, eksporteret: new Date().toISOString(), progress: p, egneTogter }, null, 2)
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

  function importer(p: Progress, togter?: GemtTogt[]) {
    update({ ...TOM_PROGRESS, ...p }) // nyt stempel → vinder i skyen
    for (const g of togter ?? []) void gemTogt({ ...g, updatedAt: Date.now() })
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

  function tilfoejTogtFraFil(text: string): { ok: boolean; besked: string } {
    const r = parseTogtFil(text)
    if (!r.ok) return { ok: false, besked: 'Filen kunne ikke bruges: ' + r.fejl.slice(0, 4).join(' · ') }
    const optaget = new Set([...DEMO_IDS, ...Object.keys(lagerRef.current)])
    const nu = Date.now()
    r.togter.forEach((t, i) => {
      const id = t.id && !optaget.has(t.id) && /^[a-z0-9-]{1,64}$/.test(t.id) ? t.id : nytTogtId(optaget)
      optaget.add(id)
      void gemTogt({ togt: { ...t, id, ark: t.ark ? { ...t.ark, foto: false } : undefined }, updatedAt: nu + i, oprettet: nu + i })
    })
    const navne = r.togter.map((t) => `"${t.title}"`).join(', ')
    const adv = r.advarsler.length ? ` Bemærk: ${r.advarsler.slice(0, 3).join(' · ')}` : ''
    return { ok: true, besked: `Tilføjet: ${navne}.${adv}` }
  }

  /** Gem et godkendt, scannet togt og dets foto. */
  async function gemScannet(t: Togt, foto: Blob | null) {
    const optaget = new Set([...DEMO_IDS, ...Object.keys(lagerRef.current)])
    const id = nytTogtId(optaget)
    const nu = Date.now()
    const togt: Togt = { ...t, id, ark: t.ark ? { ...t.ark, foto: false } : undefined }
    await gemTogt({ togt, updatedAt: nu, oprettet: nu })
    setScreen({ kind: 'home' })
    const k = kodeRef.current
    let fotoBesked = ''
    if (foto && k) {
      const fejl = await uploadArk(k, id, foto)
      if (!fejl) {
        const g = lagerRef.current[id]
        if (g) await gemTogt({ ...g, togt: { ...g.togt, ark: { navn: g.togt.ark?.navn ?? g.togt.title, kunPapir: g.togt.ark?.kunPapir, foto: true, fotoV: Date.now() } }, updatedAt: Date.now() })
      } else fotoBesked = ` (Fotoet blev ikke gemt: ${fejl})`
    }
    addToasts([`${tema.flag} "${t.title}" er klar med ${t.opgaver.length} opgaver.${fotoBesked}`])
    fest('stor')
  }

  function gemAi(a: AiIndstillinger) {
    saveAi(a)
    setAi(a)
  }

  function eksporterTogt(t: Togt) {
    downloadFil(`kaptajn-tal-togt-${filnavn(t.title)}.json`, togtTilFil(t))
  }

  function sletTogt(t: Togt) {
    const g = lagerRef.current[t.id]
    if (!g) return
    void gemTogt({ ...g, slettet: true, updatedAt: Date.now() })
    addToasts([`🗑 "${t.title}" er slettet.`])
  }

  async function gemFoto(t: Togt, fil: File): Promise<string | null> {
    const k = kodeRef.current
    if (!k) return 'Arkfotos kræver en familiekode.'
    let blob: Blob
    try {
      blob = await komprimer(fil)
    } catch {
      return 'Billedet kunne ikke læses.'
    }
    const fejl = await uploadArk(k, t.id, blob)
    if (fejl) return fejl
    const g = lagerRef.current[t.id]
    if (g) void gemTogt({ ...g, togt: { ...g.togt, ark: { navn: g.togt.ark?.navn ?? g.togt.title, kunPapir: g.togt.ark?.kunPapir, foto: true, fotoV: Date.now() } }, updatedAt: Date.now() })
    return null
  }

  function fjernFoto(t: Togt) {
    const k = kodeRef.current
    if (k) void sletArk(k, t.id)
    const g = lagerRef.current[t.id]
    if (g?.togt.ark) void gemTogt({ ...g, togt: { ...g.togt, ark: { ...g.togt.ark, foto: false } }, updatedAt: Date.now() })
  }

  async function genindlaes() {
    setGenindlaeser(true)
    await flush()
    window.location.reload()
  }

  // ------------------------------------------------------------ render
  const active: MenuKey | null =
    screen.kind === 'home' || screen.kind === 'togt' || screen.kind === 'scan' || screen.kind === 'ret' || screen.kind === 'traening'
      ? 'home'
      : screen.kind === 'skat' || screen.kind === 'begrav'
        ? 'skat'
        : screen.kind === 'oversigt'
          ? 'oversigt'
          : 'crew'

  const kodeKort: ReactNode = (
    <FamilieKode kode={kode} sync={sync} onForbind={forbind} onLoes={loes} onAfbryd={afbryd} onEksport={eksporter} onImport={importer} onGendan={gendan} />
  )

  const egneTogter = synlige(lager)
  const alleTogter: Togt[] = [...demoTogter(tema.id), ...egneTogter].map((t) =>
    t.ark?.foto && kode ? { ...t, ark: { ...t.ark, billede: `${arkUrl(kode, t.id)}?v=${t.ark.fotoV ?? 0}` } } : t,
  )
  const findTogt = (id: string) => alleTogter.find((t) => t.id === id)

  const mineTogterKort: ReactNode = (
    <MineTogter
      togter={egneTogter}
      rapporter={Object.fromEntries(egneTogter.map((t) => [t.id, Object.values(progress.togter[t.id]?.svar ?? {}).filter((s) => s.rapport).length]))}
      onRet={(id) => setScreen({ kind: 'ret', togtId: id })}
      onScan={() => setScreen({ kind: 'scan' })}
      harKode={!!kode}
      onTilfoejFil={tilfoejTogtFraFil}
      onEksport={eksporterTogt}
      onSlet={sletTogt}
      onFoto={gemFoto}
      onFjernFoto={fjernFoto}
    />
  )

  function velkommenFaerdig(valg: 'demo' | 'scan' | 'forside') {
    try {
      localStorage.setItem(VELKOMMEN_KEY, '1')
    } catch {
      /* ignorer */
    }
    setVelkommen(false)
    if (valg === 'demo') setScreen({ kind: 'togt', togtId: 'demo', startIndex: 0 })
    else if (valg === 'scan') setScreen({ kind: 'scan' })
    else setScreen({ kind: 'home' })
  }

  const traenStatus = traeningsStatus(alleTogter, progress)

  function startTraeningsomgang() {
    const t = lavTraening(alleTogter, ref.current, tema, Date.now() % 2147483647)
    if (t.opgaver.length === 0) {
      addToasts(['Der er ikke nok opgaver at træne på endnu.'])
      return
    }
    update(startTraening(ref.current))
    setTraeningTogt(t)
    setScreen({ kind: 'traening' })
  }

  let content
  if (velkommen) {
    content = (
      <Velkommen
        navn={progress.name}
        klasse={progress.klasse}
        onKlasse={(k) => update({ ...progress, klasse: k })}
        onTema={(id: TemaId) => update({ ...progress, tema: id })}
        onNavn={(name) => update({ ...progress, name })}
        onForbind={forbind}
        onFaerdig={velkommenFaerdig}
      />
    )
  } else if (screen.kind === 'togt' && findTogt(screen.togtId)) {
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
        onRapport={(opgaveId) => rapport(togt.id, opgaveId)}
        onExit={() => setScreen({ kind: 'home' })}
      />
    )
  } else if (screen.kind === 'ret' && lager[screen.togtId] && !lager[screen.togtId].slettet) {
    const t = alleTogter.find((x) => x.id === screen.togtId)!
    content = (
      <Gennemse
        key={t.id}
        togt={t}
        usikre={{}}
        fotoUrls={t.ark?.billede ? [t.ark.billede] : []}
        overskrift={`Ret "${t.title}"`}
        kasserTekst="Fortryd"
        onGem={gemRettet}
        onKasser={() => setScreen({ kind: 'home' })}
      />
    )
  } else if (screen.kind === 'traening' && traeningTogt) {
    content = (
      <TogtView
        key={traeningTogt.opgaver[0]?.id ?? 'traening'}
        togt={traeningTogt}
        progress={progress}
        startIndex={0}
        iDag={iDag}
        traening
        onResultat={(opgaveId, r) => resultat(TRAENING_ID, opgaveId, r)}
        onTick={tick}
        onBegrav={() => setScreen({ kind: 'begrav' })}
        onOversigt={() => setScreen({ kind: 'home' })}
        onRapport={() => 0}
        onIgen={startTraeningsomgang}
        onExit={() => setScreen({ kind: 'home' })}
      />
    )
  } else if (screen.kind === 'scan') {
    content = <Scan kode={kode} tema={tema.id} klasse={progress.klasse ?? 0} ai={ai} onGemAi={gemAi} onGem={(t, foto) => void gemScannet(t, foto)} onExit={() => setScreen({ kind: 'home' })} />
  } else if (screen.kind === 'oversigt') {
    content = <Oversigt progress={progress} togter={alleTogter} egne={new Set(egneTogter.map((t) => t.id))} onRet={(id) => setScreen({ kind: 'ret', togtId: id })} fokus={screen.togtId} onStart={(togtId, startIndex) => setScreen({ kind: 'togt', togtId, startIndex })} />
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
        togter={alleTogter}
        kodeKort={kodeKort}
        mineTogter={mineTogterKort}
        onName={(name) => update({ ...progress, name })}
        onTema={(id: TemaId) => update({ ...progress, tema: id })}
        onKlasse={(k) => update({ ...progress, klasse: k })}
        traening={traenStatus}
        onTraening={startTraeningsomgang}
        onStart={(togtId, startIndex) => setScreen({ kind: 'togt', togtId, startIndex })}
        onOversigt={(togtId) => setScreen({ kind: 'oversigt', togtId })}
      />
    )
  }

  return (
    <TemaProvider tema={tema}>
      {!velkommen && <TopMenu active={active} progress={progress} onNav={(k) => setScreen({ kind: k })} />}
      {content}
      <Footer onRefresh={() => void genindlaes()} travl={genindlaeser} lyd={lyd} onLyd={skiftLyd} />
      <Toasts items={toasts} onDone={removeToast} />
      <KonfettiLag />
    </TemaProvider>
  )
}
