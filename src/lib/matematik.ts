// ---------------------------------------------------------------------------
// Lille matematik-motor: læser og regner udtryk som "3x^2 - 5x + 2", "√(x+1)",
// "2(x+3)", "3/4", "π·r^2". Bruges til nye opgavetyper, grafer og facit-tjek.
// Ingen eval – udtrykket parses til et træ og regnes ud.
//
// Understøtter: tal (komma eller punktum), x (eller anden variabel), + − · × * / : ÷,
// ^ og ² ³, √ / sqrt, π / pi, parenteser, fortegn og skjult gange (2x, 3(x+1), x(x-1)).
// ---------------------------------------------------------------------------

type Node =
  | { k: 'tal'; v: number }
  | { k: 'var'; navn: string }
  | { k: 'op'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { k: 'neg'; a: Node }
  | { k: 'fn'; fn: 'sqrt' | 'abs'; a: Node }

type Token = { t: 'tal'; v: number } | { t: 'navn'; v: string } | { t: 'op'; v: string } | { t: '('; v: '(' } | { t: ')'; v: ')' }

/** Ensret skrivemåder, så parseren kun skal kende én form. */
export function normaliser(s: string): string {
  return s
    .replace(/−|–|—/g, '-')
    .replace(/·|×|⋅|\*/g, '*')
    .replace(/:|÷/g, '/')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, '')
}

function tokenize(s: string): Token[] {
  const ud: Token[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const v = Number(s.slice(i, j))
      if (!Number.isFinite(v)) throw new Error('Ugyldigt tal')
      ud.push({ t: 'tal', v })
      i = j
    } else if (/[a-zæøå]/i.test(c)) {
      let j = i
      while (j < s.length && /[a-zæøå]/i.test(s[j])) j++
      const ord = s.slice(i, j).toLowerCase()
      // "sqrt", "abs" og "pi" er ord; alt andet deles op i enkelte bogstaver (xy = x*y)
      const kendte = ['sqrt', 'abs', 'pi']
      let p = 0
      while (p < ord.length) {
        const k = kendte.find((w) => ord.startsWith(w, p))
        if (k) {
          ud.push({ t: 'navn', v: k })
          p += k.length
        } else {
          ud.push({ t: 'navn', v: ord[p] })
          p++
        }
      }
      i = j
    } else if ('+-*/^'.includes(c)) {
      ud.push({ t: 'op', v: c })
      i++
    } else if (c === '(' || c === '[') {
      ud.push({ t: '(', v: '(' })
      i++
    } else if (c === ')' || c === ']') {
      ud.push({ t: ')', v: ')' })
      i++
    } else {
      throw new Error(`Ukendt tegn "${c}"`)
    }
  }
  // Skjult gange: 2x, 2(, x(, )(, )x, )2, x y
  const med: Token[] = []
  for (let n = 0; n < ud.length; n++) {
    const a = ud[n - 1]
    const b = ud[n]
    const aSlut = a && (a.t === 'tal' || a.t === ')' || (a.t === 'navn' && a.v !== 'sqrt' && a.v !== 'abs'))
    const bStart = b.t === 'tal' || b.t === '(' || b.t === 'navn'
    if (aSlut && bStart) med.push({ t: 'op', v: '*' })
    med.push(b)
  }
  return med
}

class Parser {
  private i = 0
  constructor(private tk: Token[]) {}
  private kig() {
    return this.tk[this.i]
  }
  private tag() {
    return this.tk[this.i++]
  }
  parse(): Node {
    const n = this.sum()
    if (this.i < this.tk.length) throw new Error('Uventet tegn til sidst')
    return n
  }
  private sum(): Node {
    let n = this.produkt()
    for (let t = this.kig(); t && t.t === 'op' && (t.v === '+' || t.v === '-'); t = this.kig()) {
      this.tag()
      n = { k: 'op', op: t.v as '+' | '-', a: n, b: this.produkt() }
    }
    return n
  }
  private produkt(): Node {
    let n = this.fortegn()
    for (let t = this.kig(); t && t.t === 'op' && (t.v === '*' || t.v === '/'); t = this.kig()) {
      this.tag()
      n = { k: 'op', op: t.v as '*' | '/', a: n, b: this.fortegn() }
    }
    return n
  }
  private fortegn(): Node {
    const t = this.kig()
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.tag()
      const a = this.fortegn()
      return t.v === '-' ? { k: 'neg', a } : a
    }
    return this.potens()
  }
  private potens(): Node {
    const grund = this.atom()
    const t = this.kig()
    if (t && t.t === 'op' && t.v === '^') {
      this.tag()
      return { k: 'op', op: '^', a: grund, b: this.fortegn() } // højre-associativ, tillader 2^-1
    }
    return grund
  }
  private atom(): Node {
    const t = this.tag()
    if (!t) throw new Error('Udtrykket slutter for tidligt')
    if (t.t === 'tal') return { k: 'tal', v: t.v }
    if (t.t === '(') {
      const n = this.sum()
      if (this.tag()?.t !== ')') throw new Error('Mangler )')
      return n
    }
    if (t.t === 'navn') {
      if (t.v === 'pi') return { k: 'tal', v: Math.PI }
      if (t.v === 'sqrt' || t.v === 'abs') return { k: 'fn', fn: t.v, a: this.potens() }
      return { k: 'var', navn: t.v }
    }
    throw new Error('Uventet tegn')
  }
}

function regn(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case 'tal':
      return n.v
    case 'var': {
      const v = env[n.navn]
      if (v === undefined) throw new Error(`Ukendt variabel ${n.navn}`)
      return v
    }
    case 'neg':
      return -regn(n.a, env)
    case 'fn': {
      const a = regn(n.a, env)
      return n.fn === 'sqrt' ? Math.sqrt(a) : Math.abs(a)
    }
    case 'op': {
      const a = regn(n.a, env)
      const b = regn(n.b, env)
      switch (n.op) {
        case '+':
          return a + b
        case '-':
          return a - b
        case '*':
          return a * b
        case '/':
          return a / b
        case '^':
          return a ** b
      }
    }
  }
}

function variabler(n: Node, ud = new Set<string>()): Set<string> {
  if (n.k === 'var') ud.add(n.navn)
  if (n.k === 'neg' || n.k === 'fn') variabler(n.a, ud)
  if (n.k === 'op') {
    variabler(n.a, ud)
    variabler(n.b, ud)
  }
  return ud
}

export interface Udtryk {
  regn: (env?: Record<string, number>) => number
  variabler: string[]
}

/** Læs et udtryk. Returnerer null, hvis det ikke kan læses. */
export function laesUdtryk(s: string): Udtryk | null {
  try {
    const tree = new Parser(tokenize(normaliser(s))).parse()
    return { regn: (env = {}) => regn(tree, env), variabler: [...variabler(tree)] }
  } catch {
    return null
  }
}

/** Regn et udtryk uden variabler ud. null hvis det ikke kan. */
export function regnUd(s: string): number | null {
  const u = laesUdtryk(s)
  if (!u || u.variabler.length) return null
  const v = u.regn()
  return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : null
}

const naer = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b))

/** Er to udtryk ens for alle x? Testes i en række punkter. */
export function ensUdtryk(a: string, b: string): boolean | null {
  const ua = laesUdtryk(a)
  const ub = laesUdtryk(b)
  if (!ua || !ub) return null
  const vars = [...new Set([...ua.variabler, ...ub.variabler])]
  const punkter = [-2.3, -0.7, 0.4, 1.3, 2.9, 4.1]
  let testet = 0
  for (const p of punkter) {
    const env = Object.fromEntries(vars.map((v, i) => [v, p + i * 0.37]))
    let va: number, vb: number
    try {
      va = ua.regn(env)
      vb = ub.regn(env)
    } catch {
      return null
    }
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue
    testet++
    if (!naer(va, vb)) return false
  }
  return testet > 0 ? true : null
}

/** Opfylder x = værdi ligningen "venstre = højre"? null hvis ligningen ikke kan læses. */
export function loeserLigning(ligning: string, vaerdi: number, variabel = 'x'): boolean | null {
  const dele = ligning.split('=')
  if (dele.length !== 2) return null
  const v = laesUdtryk(dele[0])
  const h = laesUdtryk(dele[1])
  if (!v || !h) return null
  try {
    const env = { [variabel]: vaerdi }
    return naer(v.regn(env), h.regn(env), 1e-4)
  } catch {
    return null
  }
}

/** Læs et tal eller en brøk ("3/4", "-1 1/2" undtaget) som [tæller, nævner]. */
export function laesBroek(s: string): [number, number] | null {
  const t = normaliser(s)
  const m = t.match(/^(-?\d+)\/(-?\d+)$/)
  if (m) {
    const n = Number(m[2])
    return n === 0 ? null : [Number(m[1]), n]
  }
  if (/^-?\d+$/.test(t)) return [Number(t), 1]
  return null
}

/** Afrund til et antal decimaler. */
export function afrund(v: number, decimaler: number): number {
  const f = 10 ** decimaler
  return Math.round(v * f) / f
}
