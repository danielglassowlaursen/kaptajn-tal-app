import { Fragment, type ReactNode } from 'react'

/**
 * Vis matematik pænt uden et tungt bibliotek:
 * x^2 → x², x^(n+1) → x med hævet (n+1), sqrt(…) / √ → √, * → ·, pi → π,
 * og simple brøker a/b mellem tal vises med brøkstreg.
 */
export function Mat({ tekst }: { tekst: string }) {
  return <span className="mat">{formater(tekst)}</span>
}

function formater(s: string): ReactNode[] {
  const t = s
    .replace(/sqrt\s*/gi, '√')
    .replace(/\bpi\b/gi, 'π')
    .replace(/(\d)\s*\*\s*(\d)/g, '$1 · $2')
    .replace(/\*/g, '·')
    .replace(/(\s)-(\s)/g, '$1−$2')
    .replace(/^-|([(=\s])-(?=[\dxa-zæøå(√])/gi, (_m: string, f?: string) => (f ?? '') + '−')
  const ud: ReactNode[] = []
  // Potenser (^tal, ^x eller ^(…)) og brøker (tal/tal)
  const re = /\^(\([^()]*\)|-?\d+(?:[.,]\d+)?|[a-zæøå])|(\d+)\s*\/\s*(\d+)/gi
  let sidst = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(t))) {
    ud.push(t.slice(sidst, m.index))
    if (m[1] !== undefined) {
      const ex = m[1].startsWith('(') ? m[1].slice(1, -1) : m[1]
      ud.push(<sup key={k++}>{ex}</sup>)
    } else {
      ud.push(
        <span className="broek" key={k++}>
          <span className="broek-t">{m[2]}</span>
          <span className="broek-n">{m[3]}</span>
        </span>,
      )
    }
    sidst = m.index + m[0].length
  }
  ud.push(t.slice(sidst))
  return ud.map((x, i) => <Fragment key={`f${i}`}>{x}</Fragment>)
}
