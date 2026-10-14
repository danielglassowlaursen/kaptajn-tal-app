import type { Progress } from '../types'
import { appNavn, useTema } from '../tema'

export type MenuKey = 'home' | 'skat' | 'crew' | 'oversigt'

interface Props {
  active: MenuKey | null
  progress: Progress
  onNav: (k: MenuKey) => void
}

/** Fast topmenu: Togter, Din skat, Din besætning. */
export function TopMenu({ active, progress, onNav }: Props) {
  const t = useTema()
  const loest = Object.values(progress.togter).reduce((n, t) => n + Object.keys(t.done).length, 0)
  const items: { key: MenuKey; emoji: string; label: string; badge?: string }[] = [
    { key: 'home', emoji: t.menu.rejser[0], label: t.menu.rejser[1] },
    { key: 'skat', emoji: t.menu.skat[0], label: t.menu.skat[1], badge: progress.pung > 0 ? `${progress.skat} +${progress.pung}` : `${progress.skat}` },
    { key: 'crew', emoji: t.menu.crew[0], label: t.menu.crew[1], badge: `${progress.crew.length}` },
    { key: 'oversigt', emoji: '📋', label: 'Oversigt', badge: `${loest}` },
  ]
  return (
    <nav className="topmenu" aria-label="Hovedmenu">
      <button className="topmenu-brand" onClick={() => onNav('home')}>
        {t.flag} <span>{appNavn(t)}</span>
      </button>
      <div className="topmenu-items">
        {items.map((it) => (
          <button
            key={it.key}
            className={`topmenu-item ${active === it.key ? 'is-active' : ''}`}
            onClick={() => onNav(it.key)}
            aria-current={active === it.key ? 'page' : undefined}
          >
            <span className="topmenu-emoji">{it.emoji}</span>
            <span className="topmenu-label">{it.label}</span>
            {it.badge !== undefined && <span className="topmenu-badge">{it.badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  )
}
