import type { Visual } from '../types'

/** Små SVG-tegninger, der hjælper med at "se" opgaven. */
export function VisualView({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case 'gitter':
      return <Gitter rows={visual.rows} cols={visual.cols} label={visual.label} />
    case 'rektangel':
      return <Rektangel w={visual.w} h={visual.h} unit={visual.unit ?? 'cm'} />
    case 'trekant':
      return <Trekant sides={visual.sides} unit={visual.unit ?? 'cm'} />
    case 'lineal':
      return <Lineal length={visual.length} label={visual.label} />
    case 'soejler':
      return <Soejler bars={visual.bars} unit={visual.unit} />
    case 'koordinat':
      return <Koordinat size={visual.size} points={visual.points} marker={visual.marker} closed={visual.closed} />
    case 'moenter':
      return <Moenter groups={visual.groups} perGroup={visual.perGroup} />
  }
}

const INK = '#2b1d0e'
const FILL = '#f7ecd2'
const GOLD = '#e0a526'
const RED = '#b23a2a'

function Gitter({ rows, cols, label }: { rows: number; cols: number; label?: string }) {
  const c = 34
  const W = cols * c + 2
  const H = rows * c + 2
  const cells = []
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++)
      cells.push(<rect key={`${r}-${k}`} x={1 + k * c} y={1 + r * c} width={c} height={c} fill={FILL} stroke={INK} strokeWidth={1.5} />)
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {cells}
      </svg>
      {label && <figcaption>{label}</figcaption>}
    </figure>
  )
}

function Rektangel({ w, h, unit }: { w: number; h: number; unit: string }) {
  const s = Math.min(40, 260 / w, 160 / h)
  const pw = w * s
  const ph = h * s
  const pad = 34
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${pw + pad * 2} ${ph + pad * 2}`} width={pw + pad * 2} height={ph + pad * 2}>
        <rect x={pad} y={pad} width={pw} height={ph} fill={FILL} stroke={INK} strokeWidth={2} />
        <text x={pad + pw / 2} y={pad - 10} textAnchor="middle" fontSize="15" fill={INK} fontWeight="700">
          {w} {unit}
        </text>
        <text x={pad + pw + 10} y={pad + ph / 2 + 5} fontSize="15" fill={INK} fontWeight="700">
          {h} {unit}
        </text>
      </svg>
    </figure>
  )
}

function Trekant({ sides, unit }: { sides: [number, number, number]; unit: string }) {
  const W = 220
  const H = 190
  const pts: [number, number][] = [
    [30, H - 30],
    [W - 30, H - 30],
    [W / 2, 30],
  ]
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const mBottom = mid(pts[0], pts[1])
  const mRight = mid(pts[1], pts[2])
  const mLeft = mid(pts[2], pts[0])
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={FILL} stroke={INK} strokeWidth={2} />
        <text x={mBottom[0]} y={mBottom[1] + 20} textAnchor="middle" fontSize="15" fontWeight="700" fill={INK}>
          {sides[0]} {unit}
        </text>
        <text x={mRight[0] + 14} y={mRight[1]} fontSize="15" fontWeight="700" fill={INK}>
          {sides[1]} {unit}
        </text>
        <text x={mLeft[0] - 14} y={mLeft[1]} textAnchor="end" fontSize="15" fontWeight="700" fill={INK}>
          {sides[2]} {unit}
        </text>
      </svg>
    </figure>
  )
}

function Lineal({ length, label }: { length: number; label?: string }) {
  const cm = 28
  const max = 12
  const x0 = 16
  const W = x0 * 2 + max * cm
  const H = 96
  const ticks = []
  for (let i = 0; i <= max * 10; i++) {
    const x = x0 + (i / 10) * cm
    const big = i % 10 === 0
    const mid = i % 5 === 0
    ticks.push(<line key={i} x1={x} y1={54} x2={x} y2={big ? 74 : mid ? 68 : 62} stroke={INK} strokeWidth={big ? 1.5 : 1} />)
    if (big)
      ticks.push(
        <text key={`t${i}`} x={x} y={90} textAnchor="middle" fontSize="12" fill={INK} fontWeight="700">
          {i / 10}
        </text>,
      )
  }
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ maxWidth: '100%' }}>
        <rect x={x0} y={20} width={length * cm} height={18} rx={9} fill="#8a5a2b" stroke={INK} strokeWidth={1.5} />
        {label && (
          <text x={x0 + (length * cm) / 2} y={33} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
            {label}
          </text>
        )}
        <rect x={x0 - 8} y={52} width={max * cm + 16} height={44} fill="#fbf3dc" stroke={INK} strokeWidth={1.5} />
        {ticks}
      </svg>
      <figcaption>Linealen viser cm</figcaption>
    </figure>
  )
}

function Soejler({ bars, unit }: { bars: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(12, ...bars.map((b) => b.value))
  const bw = 40
  const gap = 18
  const left = 36
  const top = 12
  const chartH = 160
  const W = left + bars.length * (bw + gap) + 10
  const H = top + chartH + 30
  const y = (v: number) => top + chartH - (v / max) * chartH
  const grid = []
  for (let v = 0; v <= max; v += 2)
    grid.push(
      <g key={v}>
        <line x1={left} y1={y(v)} x2={W - 6} y2={y(v)} stroke="#c9b58a" strokeWidth={1} />
        <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={INK}>
          {v}
        </text>
      </g>,
    )
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {grid}
        {bars.map((b, i) => {
          const x = left + gap / 2 + i * (bw + gap)
          return (
            <g key={b.label}>
              <rect x={x} y={y(b.value)} width={bw} height={chartH - (y(b.value) - top)} fill={GOLD} stroke={INK} strokeWidth={1.5} />
              <text x={x + bw / 2} y={top + chartH + 18} textAnchor="middle" fontSize="12" fill={INK} fontWeight="700">
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>
      {unit && <figcaption>Søjlerne viser {unit}</figcaption>}
    </figure>
  )
}

function Koordinat({
  size,
  points,
  marker,
  closed,
}: {
  size: number
  points?: [number, number][]
  marker?: [number, number]
  closed?: boolean
}) {
  const c = 32
  const left = 26
  const bottom = 24
  const W = left + size * c + 12
  const H = size * c + bottom + 12
  const px = (x: number) => left + x * c
  const py = (yy: number) => 12 + (size - yy) * c
  const lines = []
  for (let i = 0; i <= size; i++) {
    lines.push(<line key={`v${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(size)} stroke={INK} strokeWidth={i === 0 ? 2 : 1} />)
    lines.push(<line key={`h${i}`} x1={px(0)} y1={py(i)} x2={px(size)} y2={py(i)} stroke={INK} strokeWidth={i === 0 ? 2 : 1} />)
    lines.push(
      <text key={`tx${i}`} x={px(i)} y={py(0) + 16} textAnchor="middle" fontSize="11" fill={INK}>
        {i}
      </text>,
    )
    lines.push(
      <text key={`ty${i}`} x={px(0) - 8} y={py(i) + 4} textAnchor="end" fontSize="11" fill={INK}>
        {i}
      </text>,
    )
  }
  const poly = points?.map((p) => `${px(p[0])},${py(p[1])}`).join(' ')
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <rect x={px(0)} y={py(size)} width={size * c} height={size * c} fill={FILL} />
        {lines}
        {poly &&
          (closed ? (
            <polygon points={poly} fill="rgba(178,58,42,0.18)" stroke={RED} strokeWidth={3} strokeLinejoin="round" />
          ) : (
            <polyline points={poly} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />
          ))}
        {points?.map((p, i) => (
          <circle key={i} cx={px(p[0])} cy={py(p[1])} r={4} fill={RED} />
        ))}
        {marker && (
          <text x={px(marker[0])} y={py(marker[1]) + 8} textAnchor="middle" fontSize="24" fontWeight="900" fill={RED}>
            ✕
          </text>
        )}
      </svg>
      <figcaption>x = til højre · y = opad</figcaption>
    </figure>
  )
}

function Moenter({ groups, perGroup }: { groups: number; perGroup: number }) {
  return (
    <figure className="fig">
      <div className="moenter">
        {Array.from({ length: groups }, (_, i) => (
          <div className="bunke" key={i}>
            <span className="bunke-ikon">💰</span>
            <span className="bunke-tal">{perGroup}</span>
          </div>
        ))}
      </div>
      <figcaption>
        {groups} bunker med {perGroup} i hver
      </figcaption>
    </figure>
  )
}
