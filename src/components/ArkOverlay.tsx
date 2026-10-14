import { useEffect } from 'react'

interface Props {
  navn: string
  billede: string
  nr?: string
  onClose: () => void
}

/** Viser fotoet af papir-arket, så svaret kan skrives af på papiret. */
export function ArkOverlay({ navn, billede, nr, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="ark-overlay" role="dialog" aria-label={navn}>
      <div className="ark-bar">
        <div>
          📄 <b>{navn}</b>
          {nr && <span className="ark-nr"> · find {nr} på arket</span>}
        </div>
        <button className="btn btn-primary btn-small" onClick={onClose}>
          Luk ✕
        </button>
      </div>
      <div className="ark-scroll" onClick={onClose}>
        <img src={billede} alt={navn} className="ark-img" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  )
}
