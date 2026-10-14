// Fra modellens flade svar til appens opgaveformat (src/types.ts).
import type { Opgave, Togt } from '../../src/types'
import type { RaaOpgave, RaaTogt } from './skema'

const tekst = (s: string | null | undefined) => (s && s.trim() ? s.trim() : undefined)

function base(r: RaaOpgave, i: number) {
  return {
    id: `o${i + 1}`,
    nr: r.nr > 0 ? r.nr : undefined,
    story: r.historie,
    question: r.spoergsmaal,
    regnestykke: tekst(r.regnestykke),
    hints: [r.hint_1, r.hint_2].filter((h) => h && h.trim()),
    papir: tekst(r.papir),
  }
}

export function tilOpgave(r: RaaOpgave, i: number): Opgave {
  const b = base(r, i)
  switch (r.type) {
    case 'tal':
      return { ...b, type: 'tal', answer: r.svar_tal, unit: tekst(r.enhed) }
    case 'talraekke':
      return { ...b, type: 'talraekke', sequence: r.raekke, answers: r.raekke_svar }
    case 'vaelg':
      return { ...b, type: 'vaelg', items: r.valgmuligheder, correct: r.rigtige }
    case 'sammenlign':
      return { ...b, type: 'sammenlign', left: r.venstre, right: r.hoejre, answer: (['>', '<', '='].includes(r.svar_tekst) ? r.svar_tekst : '=') as '>' | '<' | '=' }
    case 'sorter':
      return { ...b, type: 'sorter', items: r.valgmuligheder, sorted: r.sorteret }
    case 'valg':
      return { ...b, type: 'valg', options: r.valgmuligheder, answer: r.svar_tekst }
    case 'felter':
      return { ...b, type: 'felter', total: r.felter_total, cols: r.felter_kolonner > 0 ? r.felter_kolonner : Math.min(6, r.felter_total || 4), answer: r.svar_tal }
    case 'ciffer':
      return { ...b, type: 'ciffer', numbers: r.tal_liste, place: r.plads || 'enere' }
    case 'koordinat': {
      const x = r.x
      const y = r.y
      const size = Math.max(5, x, y)
      return { ...b, type: 'koordinat', answer: [x, y], visual: { kind: 'koordinat', size, marker: [x, y] } }
    }
  }
}

export function tilTogt(r: RaaTogt): { togt: Togt; usikre: Record<string, string> } {
  const togt: Togt = {
    id: '',
    title: r.titel,
    subtitle: 'Scannet ark',
    emoji: r.emoji || '🗺️',
    intro: r.intro,
    ark: { navn: tekst(r.ark_navn) ?? r.titel, kunPapir: r.kun_papir.length ? r.kun_papir : undefined },
    opgaver: r.opgaver.map(tilOpgave),
  }
  const usikre: Record<string, string> = {}
  r.opgaver.forEach((o, i) => {
    if (o.usikker) usikre[`o${i + 1}`] = tekst(o.usikker_grund) ?? 'Modellen var usikker'
  })
  return { togt, usikre }
}
