/** Guldmønt som SVG, så den ser ens ud på alle enheder (emoji-mønten er grå på nogle). */
export function Moent({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ verticalAlign: '-0.2em', marginRight: 4, display: 'inline-block' }}
    >
      <circle cx="12" cy="12" r="11" fill="#c98a12" />
      <circle cx="12" cy="12" r="9" fill="#f2b632" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#c98a12" strokeWidth="1.2" />
      <text x="12" y="15.6" textAnchor="middle" fontSize="9" fontWeight="900" fill="#8f6208" fontFamily="Nunito, sans-serif">
        $
      </text>
    </svg>
  )
}
