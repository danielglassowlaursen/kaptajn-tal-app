/** Søkortet: et skib der sejler fra ankeret mod skatteøen, efterhånden som opgaverne løses. */
import { useTema } from '../tema'

export function Kort({ progress }: { progress: number }) {
  const tema = useTema()
  const W = 640
  const H = 110
  const t = Math.min(1, Math.max(0, progress))
  const x0 = 70
  const x1 = W - 70
  const pt = (f: number): [number, number] => [x0 + f * (x1 - x0), H / 2 + Math.sin(f * Math.PI * 2) * 20]
  const pts = Array.from({ length: 61 }, (_, i) => pt(i / 60))
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const [sx, sy] = pt(t)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="kort" role="img" aria-label={tema.kortNavn}>
      <path d={d} className="kort-route" />
      <text x={30} y={H / 2 + 9} textAnchor="middle" fontSize="26">
        {tema.kort.start}
      </text>
      <text x={W - 30} y={H / 2 + 11} textAnchor="middle" fontSize="34">
        {tema.kort.maal}
      </text>
      <g className="kort-ship" style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <text x={0} y={10} textAnchor="middle" fontSize="30">
          {tema.kort.fartoej}
        </text>
      </g>
    </svg>
  )
}
