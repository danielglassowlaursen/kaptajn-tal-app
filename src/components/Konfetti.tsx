import { useEffect, useState, type CSSProperties } from 'react'
import { FEST_EVENT, type Fest } from '../lib/fest'
import { Moent } from './Moent'

interface Partikel {
  id: number
  tegn: string
  style: CSSProperties
}

interface Udbrud {
  id: number
  partikler: Partikel[]
}

// 'moent' tegnes som SVG-guldmønt (emoji-mønten er grå på nogle enheder).
const GULD = ['moent', 'moent', 'moent', '💰', '⭐', '✨', '💎']
const STOR = [...GULD, '🏴‍☠️', '🦜', '⚓', '🏝️', '🗺️', '⚔️']

let naesteId = 1

function lavUdbrud(type: Fest): Udbrud {
  const antal = type === 'stor' ? 90 : 36
  const tegn = type === 'stor' ? STOR : GULD
  const partikler: Partikel[] = []
  for (let i = 0; i < antal; i++) {
    const vinkel = Math.random() * Math.PI * 2
    const fart = (type === 'stor' ? 220 : 160) * (0.4 + Math.random() * 0.8)
    const dx = Math.cos(vinkel) * fart
    const op = -Math.abs(Math.sin(vinkel)) * fart * 0.9 - 40 // først op …
    const ned = 320 + Math.random() * 260 // … så ned
    partikler.push({
      id: naesteId++,
      tegn: tegn[Math.floor(Math.random() * tegn.length)],
      style: {
        '--dx': `${dx.toFixed(0)}px`,
        '--op': `${op.toFixed(0)}px`,
        '--ned': `${ned.toFixed(0)}px`,
        '--rot': `${(Math.random() * 720 - 360).toFixed(0)}deg`,
        '--delay': `${(Math.random() * 0.15).toFixed(2)}s`,
        '--dur': `${(1.6 + Math.random() * 0.7).toFixed(2)}s`,
        fontSize: `${type === 'stor' ? 22 + Math.random() * 18 : 18 + Math.random() * 12}px`,
      } as CSSProperties,
    })
  }
  return { id: naesteId++, partikler }
}

/** Fast lag over hele skærmen, der viser konfetti-udbrud fra fest(). */
export function KonfettiLag() {
  const [udbrud, setUdbrud] = useState<Udbrud[]>([])

  useEffect(() => {
    const reduceret = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const onFest = (e: Event) => {
      if (reduceret) return
      const type = (e as CustomEvent<Fest>).detail
      const u = lavUdbrud(type)
      setUdbrud((prev) => [...prev, u])
      window.setTimeout(() => setUdbrud((prev) => prev.filter((x) => x.id !== u.id)), 2600)
    }
    window.addEventListener(FEST_EVENT, onFest)
    return () => window.removeEventListener(FEST_EVENT, onFest)
  }, [])

  if (udbrud.length === 0) return null
  return (
    <div className="konfetti" aria-hidden="true">
      {udbrud.map((u) =>
        u.partikler.map((p) => (
          <span key={p.id} className="konfetti-bit" style={p.style}>
            {p.tegn === 'moent' ? <Moent size={Number.parseFloat(String(p.style.fontSize)) * 1.1} /> : p.tegn}
          </span>
        )),
      )}
    </div>
  )
}
