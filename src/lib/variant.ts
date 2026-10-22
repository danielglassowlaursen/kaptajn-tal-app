// ---------------------------------------------------------------------------
// Varianter til træning: samme opgave og historie, men nye tal.
//
// Princip: Tallene i historien og spørgsmålet byttes ud
// med nye tal af samme størrelse. Konstanter, der kun står i "udregning" (fx 60
// i "2 · 60" for timer → minutter), bliver stående. Bagefter regner appens egen
// kontrol (kontrol.ts) det nye facit ud. Kan kontrollen ikke bekræfte varianten,
// bruges den ikke – en variant har ALDRIG et facit, appen ikke selv har regnet.
// ---------------------------------------------------------------------------
import type { Opgave, Visual } from '../types'
import { kontrol } from './kontrol'
import { answerText, formatNumber } from './check'
import { laesUdtryk, regnUd } from './matematik'

export type Rnd = () => number

/** Lille deterministisk tilfældighedsgenerator (mulberry32), så tests kan gentages. */
export function lavRnd(seed: number): Rnd {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const heltal = (rnd: Rnd, min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))
const decimalerI = (n: number) => (Number.isInteger(n) ? 0 : (String(n).split('.')[1] ?? '').length)

// Tal i tekst: "1.000" (tusindtalsseparator) undgås ved kun at tage cifre med valgfrit decimalkomma.
// Klokkeslæt (9:15, 11.00) og eksponenter springes over.
const TAL_RE = /(?<![\d.,:/^])(\d+(?:,\d+)?)(?![\d:]|[.:]\d)/g

const TALORD: Record<string, string> = {
  '2': 'to', '3': 'tre', '4': 'fire', '5': 'fem', '6': 'seks', '7': 'syv', '8': 'otte', '9': 'ni', '10': 'ti', '11': 'elleve', '12': 'tolv',
}

/** Tal i en tekst, som barnet kan se. Tider (9:15) og eksponenter springes over. */
function synligeTal(...tekster: (string | undefined)[]): string[] {
  const ud = new Set<string>()
  for (const t of tekster) if (t) for (const m of t.matchAll(TAL_RE)) ud.add(m[1])
  return [...ud]
}

/** Et nyt tal af samme slags: samme antal cifre og decimaler, aldrig det samme. */
function nytTal(s: string, rnd: Rnd): string {
  const [hel, dec] = s.split(',')
  const n = Number(hel)
  let ny: number
  if (n <= 1) ny = n // 0 og 1 bærer ofte betydning (fx "1 time"), så de bliver stående
  else if (n < 10) ny = heltal(rnd, 2, 9)
  else {
    const cifre = hel.length
    const lav = 10 ** (cifre - 1)
    const hoej = 10 ** cifre - 1
    // Runde tal (fx 60, 500) forbliver runde
    const nuller = hel.match(/0+$/)?.[0].length ?? 0
    const f = 10 ** Math.min(nuller, cifre - 1)
    ny = heltal(rnd, Math.ceil(lav / f), Math.floor(hoej / f)) * f
  }
  if (ny === n && n > 1) ny = n + (n < 9 ? 1 : 10 ** (hel.match(/0+$/)?.[0].length ?? 0))
  if (dec === undefined) return String(ny)
  const d = String(heltal(rnd, 1, 10 ** dec.length - 1)).padStart(dec.length, '0')
  return `${ny},${d}`
}

function erstat(tekst: string | undefined, kort: Map<string, string>): string | undefined {
  if (!tekst) return tekst
  return tekst.replace(TAL_RE, (m) => kort.get(m) ?? m)
}

const GENERELLE_HINTS: Record<Opgave['type'], [string, string]> = {
  tal: ['Læs historien igen: Kommer der flere til, bliver der færre, eller deles noget ligeligt?', 'Skriv regnestykket op, og regn det ud et skridt ad gangen. Passer svaret med historien?'],
  talraekke: ['Kig på to tal, der står ved siden af hinanden. Hvad sker der fra det ene til det næste?', 'Find mønsteret: Lægger man det samme til hver gang, eller ganger man med det samme? Brug det på de tomme felter.'],
  vaelg: ['Læs reglen i spørgsmålet igen, og tjek tallene ét ad gangen.', 'Gå tallene igennem fra venstre mod højre, og vælg kun dem, der passer til reglen.'],
  sammenlign: ['Regn hver side ud for sig selv først.', 'Når du har begge tal, så åbner gabet i > og < sig altid mod det største tal.'],
  sorter: ['Find det mindste tal først.', 'Sammenlign først cifrene længst til venstre – eller tallet før kommaet.'],
  valg: ['Læs spørgsmålet igen, og kig på tegningen.', 'Udelad de svar, der ikke kan passe, og vælg blandt resten.'],
  felter: ['En brøk betyder, at det hele deles i lige store dele.', 'Del antallet af felter med tallet under brøkstregen, og gang med tallet over.'],
  ciffer: ['Start fra højre: enere, tiere, hundreder, tusinder.', 'Tæl pladserne fra højre i hvert tal, og find den rigtige plads.'],
  koordinat: ['Gå først til højre langs bunden, og tæl. Gå så opad, og tæl.', 'Start i (0;0). x er antal felter til højre, y er antal felter op.'],
  flere: ['En ligning kan have mere end én løsning.', 'Prøv at skrive ligningen som et produkt, eller prøv dig frem med små tal.'],
  broek: ['Gør nævnerne ens, før du lægger sammen eller trækker fra.', 'Find en fælles nævner, regn tællerne ud, og forkort til sidst, hvis du kan.'],
  udtryk: ['Gang parenteser ud først.', 'Saml leddene med x for sig og tallene for sig.'],
}

// Hints, der påstår noget om de oprindelige tal ("en halv", "næsten 30", "husk nullet",
// "alle tallene starter med 1", "er lille") passer ikke til nye tal.
const PAASTANDE = /\ben halv\b|\bhalve\b|næsten|tæt på|starter med|alle tallene|\bnul(let|ler)?\b|\brunde?\b|\ber (lille|stor|større|mindre)\b/i

/** Må et hint genbruges i varianten? Kun hvis alle dets tal er byttet med eller er faste givne tal. */
function kanGenbruges(h: string, o: Opgave, kort: Map<string, string>, givne: Set<string>): boolean {
  if (PAASTANDE.test(h)) return false
  for (const [tal, ord] of Object.entries(TALORD)) if (kort.has(tal) && kort.get(tal) !== tal && new RegExp(`\\b${ord}\\b`, 'i').test(h)) return false
  const tal = [...h.matchAll(TAL_RE)].map((m) => m[1])
  if (o.type === 'vaelg' || o.type === 'ciffer' || o.type === 'koordinat') return tal.every((t) => t.length === 1) // reglerne afhænger ikke af tallene
  return tal.every((t) => kort.has(t) || givne.has(t))
}

function erstatHint(h: string, kort: Map<string, string>): string {
  return h.replace(TAL_RE, (m) => kort.get(m) ?? m)
}

/** Generelle hints ud fra regneoperationen i det nye regnestykke. */
function generelleHints(v: Opgave): [string, string] {
  const r = (v.udregning ?? v.regnestykke ?? '').replace(/\s+/g, '')
  if (v.type === 'tal') {
    if (/sqrt|√/.test(r)) return ['Det er en retvinklet trekant. Hvilken sætning bruger man til den længste side?', 'Brug Pythagoras: læg kvadraterne på de to korte sider sammen, og tag kvadratroden.']
    if (r.includes('=') && /x/i.test(r)) return ['Find det tal, x står for.', 'Gør det samme på begge sider af lighedstegnet, til x står alene.']
    if (/=\?|=_/.test(r)) return ['Hvor mange af den lille enhed går der på én af den store?', 'Gang eller divider med det tal, der skifter mellem de to enheder.']
    const ops = (r.replace(/^-/, '').match(/[+\-−·*:/×÷]/g) ?? []).length
    if (ops > 1) return ['Tag ét skridt ad gangen.', 'Regn gange og division først, derefter plus og minus – fra venstre mod højre.']
    if (/\d,\d/.test(r) && /[+]/.test(r)) return ['Der kommer noget til – læg sammen.', 'Læg de hele tal sammen for sig og tallene efter kommaet for sig. Bliver det over 10 tiendedele, er det en hel mere.']
    if (/\d,\d/.test(r) && /[-−]/.test(r)) return ['Noget forsvinder – træk fra.', 'Træk de hele tal fra hinanden og tallene efter kommaet fra hinanden. Mangler du tiendedele, så lån en hel.']
    if (/[+]/.test(r)) return ['Der kommer noget til – læg sammen.', 'Del det ene tal op i tiere og enere, og læg dem til hver for sig.']
    if (/[-−]/.test(r)) return ['Noget forsvinder – træk fra.', 'Træk først tierne fra og derefter enerne.']
    if (/[·*×]/.test(r)) return ['Det er lige store bunker – det er gange.', 'Del det største tal op i tiere og enere, gang hver del, og læg resultaterne sammen.']
    if (/[:/÷]/.test(r)) return ['Noget deles ligeligt – det er division.', 'Tænk på gangetabellen: Hvilket tal gange det ene giver det andet?']
  }
  return GENERELLE_HINTS[v.type]
}

function nyeHints(o: Opgave, v: Opgave, kort: Map<string, string>, givne: Set<string>): string[] {
  const gen = generelleHints(v)
  return [0, 1].map((i) => {
    const h = o.hints?.[i]
    return h && kanGenbruges(h, o, kort, givne) ? erstatHint(h, kort) : gen[i]
  })
}

function nyVisual(v: Visual | undefined, kort: Map<string, string>, o: Opgave): Visual | undefined {
  if (!v) return v
  // Tegninger med tal bruges kun, hvis ALLE deres tal er byttet sammen med teksten – ellers passer de ikke.
  const alle = (...xs: number[]) => xs.every((x) => kort.has(String(x)))
  const n = (x: number) => Number(kort.get(String(x))!.replace(',', '.'))
  switch (v.kind) {
    case 'moenter':
      return alle(v.groups, v.perGroup) ? { ...v, groups: n(v.groups), perGroup: n(v.perGroup) } : undefined
    case 'gitter':
      return alle(v.rows, v.cols) ? { ...v, rows: n(v.rows), cols: n(v.cols) } : undefined
    case 'rektangel':
      return alle(v.w, v.h) ? { ...v, w: n(v.w), h: n(v.h) } : undefined
    case 'trekant':
      return alle(...v.sides) ? { ...v, sides: [n(v.sides[0]), n(v.sides[1]), n(v.sides[2])] } : undefined
    case 'graf':
      return { ...v, funktioner: v.funktioner.map((f) => erstat(f, kort)!) }
    case 'koordinat':
      return o.type === 'koordinat' ? { ...v, marker: o.answer, points: undefined, size: Math.max(5, ...o.answer) } : v
    case 'lineal':
      return o.type === 'tal' && Number.isInteger(o.answer) && o.answer >= 1 && o.answer <= 12 ? { ...v, length: o.answer } : undefined
    case 'soejler':
      return undefined // diagrammer aflæses – ingen variant
  }
}

/** Linear forenkling til udtryk: ax + b, hvis udtrykket er lineært i x. */
function linearForm(s: string): string | null {
  const u = laesUdtryk(s)
  if (!u || u.variabler.some((v) => v !== 'x')) return null
  const f = (x: number) => u.regn({ x })
  const b = f(0)
  const a = f(1) - b
  if (Math.abs(f(2) - (2 * a + b)) > 1e-9 || Math.abs(f(-3) - (-3 * a + b)) > 1e-9) return null
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null
  const ax = a === 0 ? '' : a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`
  if (!ax) return String(b)
  return b === 0 ? ax : `${ax} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
}

/** Byg én variant. Returnerer null, hvis appen ikke kan lave en sikker variant af opgaven. */
export function lavVariant(o: Opgave, rnd: Rnd, nyId: string): Opgave | null {
  // Typer, hvor svaret aflæses på en figur, kan ikke varieres sikkert
  if (o.type === 'valg' || (o.type === 'tal' && o.visual?.kind === 'soejler')) return null

  for (let forsoeg = 0; forsoeg < 40; forsoeg++) {
    // Kun tal, der står i historien eller spørgsmålet, byttes. Tal, der kun står i regnestykket eller
    // udregningen, gemmer sig i ord ("halvdelen" = 2, "en time" = 60) og skal blive stående.
    // Har opgaven et regnestykke, skiftes kun tal, der står BÅDE i historien og i regnestykket –
    // et tal, der kun står i historien, kan være brugt indirekte (fx tælleren i "1/3 så lang").
    // Et tal, der også står som ord i historien ("tre master"), bliver stående.
    const tekst = `${o.story} ${o.question}`.toLowerCase()
    const regnTal = synligeTal(o.regnestykke, o.udregning)
    const historieTal = synligeTal(o.story, o.question)
    const harRegnestykke = !!(o.regnestykke || o.udregning) && o.type !== 'sammenlign'
    // Har historien ingen tal, er regnestykket selve opgaven (fx en ligning), og dets tal må byttes
    const kilde = historieTal.length === 0 && harRegnestykke ? synligeTal(o.regnestykke) : synligeTal(o.story, o.question, ...(o.type === 'sammenlign' ? [o.left, o.right] : []))
    const synlige = kilde.filter(
      (x) => (!harRegnestykke || historieTal.length === 0 || regnTal.includes(x)) && !(TALORD[x] && new RegExp(`\\b${TALORD[x]}\\b`).test(tekst)),
    )
    const kort = new Map<string, string>()
    // Ægte brøker (tæller < nævner) forbliver ægte: tælleren vælges under nævneren
    const regnTekst = `${o.regnestykke ?? ''} ${o.udregning ?? ''}`.replace(/\s+/g, '')
    for (const m of `${o.story} ${o.question} ${o.regnestykke ?? ''}`.matchAll(/(?<![\d,])(\d+)\s*\/\s*(\d+)(?![\d,])/g)) {
      const t = Number(m[1])
      const n = Number(m[2])
      // Kun brøker, der indgår i selve regnestykket, får ny tæller
      if (t < n && n > 2 && !kort.has(m[1]) && synlige.includes(m[1]) && regnTekst.includes(`${m[1]}/${m[2]}`)) {
        let ny = heltal(rnd, 1, n - 1)
        if (ny === t) ny = ny === n - 1 ? 1 : ny + 1
        kort.set(m[1], String(ny))
      }
    }
    // Brøkdele af en figur: antal felter i historien og på tegningen skal være det samme tal
    let nytTotal: number | null = null
    if (o.type === 'felter') {
      const fm = `${o.question} ${o.story}`.match(/(\d+)\s*\/\s*(\d+)/)
      if (!fm) return null
      nytTotal = Number(fm[2]) * heltal(rnd, 2, 4)
      if (nytTotal > 24) nytTotal = Number(fm[2]) * 2
      kort.set(String(o.total), String(nytTotal))
    }
    if (o.type === 'flere' && o.answers.length === 2 && o.answers.every(Number.isInteger)) {
      const m = (o.regnestykke ?? '').replace(/\s+/g, '').match(/^x\^2([+-])(\d*)x([+-])(\d+)=0$/)
      if (m) {
        const pos = o.answers.every((a) => a > 0)
        let r1 = heltal(rnd, pos ? 1 : -9, 9)
        let r2 = heltal(rnd, pos ? 1 : -9, 9)
        if (r1 === r2 || r1 === 0 || r2 === 0) continue
        if (r1 > r2) [r1, r2] = [r2, r1]
        const sum = r1 + r2
        const prod = r1 * r2
        // Samme fortegnsmønster som originalen, så regnestykkets "−" og "+" stadig passer
        if ((m[1] === '-') !== sum > 0 || (m[3] === '+') !== prod > 0) continue
        kort.set(m[2] || '1', String(Math.abs(sum)))
        kort.set(m[4], String(Math.abs(prod)))
      }
    }
    for (const t of synlige) if (!kort.has(t)) kort.set(t, nytTal(t, rnd))

    const v: Opgave = {
      ...o,
      id: nyId,
      story: erstat(o.story, kort)!,
      question: erstat(o.question, kort)!,
      regnestykke: erstat(o.regnestykke, kort),
      udregning: erstat(o.udregning, kort),
      papir: undefined,
      nr: undefined,
      kontrol: undefined,
      accept: undefined,
    } as Opgave

    // Typespecifikke data
    switch (v.type) {
      case 'sammenlign':
        v.left = erstat(v.left, kort)!
        v.right = erstat(v.right, kort)!
        break
      case 'sorter': {
        const nye = v.items.map((x) => nytTal(x, rnd))
        if (new Set(nye).size !== nye.length) continue
        v.items = nye
        break
      }
      case 'vaelg': {
        const nye = v.items.map((x) => (/^\d+$/.test(x) ? nytTal(x, rnd) : x))
        if (new Set(nye).size !== nye.length) continue
        v.items = nye
        v.correct = []
        break
      }
      case 'talraekke': {
        const kendte = v.sequence.map((x, i) => [i, x] as const).filter((p): p is readonly [number, number] => p[1] !== null)
        if (kendte.length < 2) return null
        const [i0, v0] = kendte[0]
        const [i1, v1] = kendte[1]
        const d = (v1 - v0) / (i1 - i0)
        const aritmetisk = kendte.every(([i, x]) => Math.abs(v0 + d * (i - i0) - x) < 1e-9)
        if (aritmetisk) {
          const spring = Math.max(2, Math.round(Math.abs(d)) + heltal(rnd, -2, 3)) * (d < 0 ? -1 : 1)
          const start = d < 0 ? heltal(rnd, 40, 99) : heltal(rnd, 1, 20)
          v.sequence = v.sequence.map((x, i) => (x === null ? null : start + spring * i))
        } else {
          const r = v0 !== 0 ? (v1 / v0) ** (1 / (i1 - i0)) : 0
          if (!Number.isInteger(r) || r < 2) return null
          const start = heltal(rnd, 1, 3)
          v.sequence = v.sequence.map((x, i) => (x === null ? null : start * r ** i))
        }
        v.answers = v.sequence.map(() => 0).filter(() => false)
        break
      }
      case 'ciffer':
        v.numbers = v.numbers.map((x) => {
          let ny = String(heltal(rnd, 10 ** (x.length - 1), 10 ** x.length - 1))
          if (ny === x) ny = String(Number(ny) + 1)
          return ny
        })
        break
      case 'koordinat': {
        const st = o.visual?.kind === 'koordinat' ? o.visual.size : 5
        v.answer = [heltal(rnd, 1, st), heltal(rnd, 1, st)]
        break
      }
      case 'felter':
        v.total = nytTotal!
        v.cols = Math.min(6, nytTotal!)
        break
    }
    v.visual = nyVisual(o.visual, kort, v)

    // Facit: altid fra appens egen kontrol
    if (v.type === 'udtryk') {
      const kilde = v.udregning ?? v.regnestykke
      const svar = kilde && !kilde.includes('=') ? linearForm(kilde) : null
      if (!svar) return null
      v.answer = svar
    } else if (v.type === 'ciffer' || v.type === 'koordinat') {
      // facit er givet af data (ciffer) eller selve tegningen (koordinat)
    } else {
      const k = kontrol(v)
      if (k.status === 'uenig' && k.forslag) Object.assign(v, k.forslag, { id: nyId, kontrol: undefined })
      else if (k.status !== 'bekraeftet') return null
    }

    // Sanity: rimelige svar (positive heltal forbliver positive heltal; flere: hele løsninger)
    if (v.type === 'tal' && o.type === 'tal') {
      if (Number.isInteger(o.answer) && v.decimaler === undefined && !Number.isInteger(v.answer)) continue
      if (o.answer > 0 && v.answer <= 0) continue
      if (o.answer >= 0 && v.answer < 0) continue
      // Ikke flere decimaler end originalen (fx 1,5 → aldrig 0,875)
      if (v.decimaler === undefined && decimalerI(v.answer) > decimalerI(o.answer)) continue
      if (!Number.isFinite(v.answer)) continue
    }
    if (v.type === 'flere' && o.type === 'flere') {
      if (v.answers.length !== o.answers.length || !v.answers.every(Number.isInteger)) continue
    }
    if (v.type === 'felter' && (v.answer <= 0 || v.answer >= v.total)) continue
    if (v.type === 'sammenlign' && o.type === 'sammenlign') {
      const [a, b, oa, ob] = [regnUd(v.left), regnUd(v.right), regnUd(o.left), regnUd(o.right)]
      if (a === null || b === null) continue
      if ((oa ?? 0) >= 0 && a < 0) continue
      if ((ob ?? 0) >= 0 && b < 0) continue
      if (oa !== null && Number.isInteger(oa) && !Number.isInteger(a)) continue
      if (ob !== null && Number.isInteger(ob) && !Number.isInteger(b)) continue
    }
    if (v.type === 'vaelg' && (v.correct.length === 0 || v.correct.length === v.items.length)) continue
    if (v.type === 'broek' && (v.answer[1] > 100 || v.answer[0] <= 0)) continue
    if (v.type === 'broek' && o.type === 'broek' && o.answer[0] < o.answer[1] && v.answer[0] >= v.answer[1]) continue

    // Endelig kontrol: varianten skal bestå appens egen kontrol eller være givet af data
    const slut = kontrol(v)
    if (slut.status === 'uenig') continue
    if (slut.status === 'ukendt' && v.type !== 'koordinat') continue

    // Alternative stavemåder (fx "19.00") følger det nye facit
    if (o.type === 'tal' && v.type === 'tal' && o.accept?.length) v.accept = o.accept.map((a) => a.replace(String(o.answer), String(v.answer)))
    const givne = new Set(synligeTal(o.story, o.question, o.regnestykke, o.udregning).filter((t) => !kort.has(t)))
    v.hints = nyeHints(o, v, kort, givne)
    // Hint 2 må ikke afsløre det nye facit
    const facitTekst = v.type === 'tal' ? [formatNumber(v.answer), String(v.answer)] : []
    if (facitTekst.some((f) => new RegExp(`(^|[^0-9,])${f.replace('.', '\\.')}(?![0-9])`).test(v.hints![1]))) v.hints[1] = generelleHints(v)[1]
    // En variant, der ikke er ændret, er ingen variant
    if (answerText(v) === answerText(o) && v.story === o.story && v.question === o.question && v.regnestykke === o.regnestykke && JSON.stringify(v.visual) === JSON.stringify(o.visual)) {
      if (o.type !== 'ciffer' && o.type !== 'vaelg' && o.type !== 'sorter' && o.type !== 'talraekke' && o.type !== 'koordinat' && o.type !== 'felter') return null
    }
    return v
  }
  return null
}
