import type { Progress } from '../types'

export type MenuKey = 'home' | 'skat' | 'crew' | 'oversigt'

interface Props {
  active: MenuKey | null
  progress: Progress
  onNav: (k: MenuKey) => void
}

/** Fast topmenu: Togter, Din skat, Din besætning. */
export function TopMenu({ active, progress, onNav }: Props) {
  const loest = Object.values(progress.togter).reduce((n, t) => n + Object.keys(t.done).length, 0)
  const items: { key: MenuKey; emoji: string; label: string; badge?: string }[] = [
    { key: 'home', emoji: '🗺️', label: 'Togter' },
    { key: 'skat', emoji: '💰', label: 'Din skat', badge: progress.pung > 0 ? `${progress.skat} +${progress.pung}` : `${progress.skat}` },
    { key: 'crew', emoji: '⚓', label: 'Din besætning', badge: `${progress.crew.length}` },
    { key: 'oversigt', emoji: '📋', label: 'Oversigt', badge: `${loest}` },
  ]
  return (
    <nav className="topmenu" aria-label="Hovedmenu">
      <button className="topmenu-brand" onClick={() => onNav('home')}>
        🏴‍☠️ <span>Kaptajn Tal</span>
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
