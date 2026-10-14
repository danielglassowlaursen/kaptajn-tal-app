import { useTema } from '../tema'

/** Temaets valuta som SVG: guldmønt eller ædelsten (ens på alle enheder, i modsætning til emoji). */
export function Moent({ size = 20 }: { size?: number }) {
  const m = useTema().moent
  const style = { verticalAlign: '-0.2em', marginRight: 4, display: 'inline-block' }
  if (m.form === 'aedelsten') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
        <polygon points="6,3 18,3 23,9 12,22 1,9" fill={m.ydre} />
        <polygon points="8,5 16,5 19.5,9 12,19 4.5,9" fill={m.indre} />
        <polygon points="8,5 12,9 16,5" fill={m.tegn} opacity="0.55" />
        <line x1="4.5" y1="9" x2="19.5" y2="9" stroke={m.ydre} strokeWidth="0.8" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <circle cx="12" cy="12" r="11" fill={m.ydre} />
      <circle cx="12" cy="12" r="9" fill={m.indre} />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke={m.ydre} strokeWidth="1.2" />
      <text x="12" y="15.6" textAnchor="middle" fontSize="9" fontWeight="900" fill={m.tegn} fontFamily="Nunito, sans-serif">
        $
      </text>
    </svg>
  )
}
