interface Props {
  onRefresh: () => void
  travl?: boolean
  lyd: boolean
  onLyd: () => void
}

/** Bund på alle sider: lyd til/fra, genindlæs-knap og kildeangivelse. */
export function Footer({ onRefresh, travl, lyd, onLyd }: Props) {
  return (
    <footer className="site-footer">
      <div className="footer-row">
        <button className="btn btn-ghost btn-small footer-refresh" onClick={onLyd} aria-pressed={lyd}>
          {lyd ? '🔊 Lyd til' : '🔇 Lyd fra'}
        </button>
        <button className="btn btn-ghost btn-small footer-refresh" onClick={onRefresh} disabled={travl}>
          🔄 {travl ? 'Gemmer og genindlæser …' : 'Genindlæs appen'}
        </button>
      </div>
      <p className="muted small">Kaptajn Tal · PolyForm Noncommercial 1.0.0</p>
    </footer>
  )
}
