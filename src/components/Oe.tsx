import type { Gravested } from '../types'

interface Props {
  sted: Gravested | null
  onPick?: (s: Gravested) => void
  compact?: boolean
}

/** Skatteøen. Tryk et sted for at vælge, hvor guldet skal begraves. */
export function Oe({ sted, onPick, compact }: Props) {
  const W = 400
  const H = 260
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPick) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    onPick({ x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) })
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`oe ${onPick ? 'oe-klik' : ''} ${compact ? 'oe-compact' : ''}`}
      onClick={handleClick}
      role={onPick ? 'button' : 'img'}
      aria-label="Skatteøen"
    >
      <defs>
        <radialGradient id="vand" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#2a7fb0" />
          <stop offset="100%" stopColor="#0f4a70" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#vand)" />
      {/* bølger */}
      {[30, 70, 200, 235].map((y, i) => (
        <path key={i} d={`M${20 + i * 15} ${y} q 10 -6 20 0 t 20 0 t 20 0`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" />
      ))}
      {/* sand */}
      <path
        d="M70 150 C 60 90, 130 45, 210 55 C 290 60, 350 95, 345 150 C 340 205, 270 235, 190 228 C 120 222, 80 200, 70 150 Z"
        fill="#e8d4a2"
        stroke="#c9ad73"
        strokeWidth="3"
      />
      {/* græs */}
      <path
        d="M110 145 C 110 105, 160 75, 220 82 C 280 88, 315 115, 308 150 C 300 190, 250 205, 195 200 C 145 195, 112 180, 110 145 Z"
        fill="#7fb069"
      />
      <text x="150" y="120" fontSize="34" textAnchor="middle">🌴</text>
      <text x="270" y="110" fontSize="30" textAnchor="middle">🌴</text>
      <text x="215" y="175" fontSize="26" textAnchor="middle">🛖</text>
      <text x="120" y="190" fontSize="22" textAnchor="middle">🪨</text>
      <text x="300" y="185" fontSize="22" textAnchor="middle">💀</text>
      {sted && (
        <text x={sted.x * W} y={sted.y * H + 10} fontSize="30" fontWeight="900" textAnchor="middle" fill="#b23a2a" stroke="#fff" strokeWidth="1">
          ✕
        </text>
      )}
    </svg>
  )
}
