interface Props {
  klasse: number | undefined
  onKlasse: (k: number) => void
}

/** Klassetrin 1–10. Bruges, så AI'ens historier og hints passer til alderen. */
export function KlasseVaelger({ klasse, onKlasse }: Props) {
  return (
    <label className="felt-label klasse-vaelger">
      Klassetrin
      <select value={klasse ?? ''} onChange={(e) => onKlasse(Number(e.target.value))}>
        <option value="" disabled>
          Vælg klasse
        </option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((k) => (
          <option key={k} value={k}>
            {k}. klasse
          </option>
        ))}
      </select>
    </label>
  )
}
