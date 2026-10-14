/** Lokal dato som 'YYYY-MM-DD' (ikke UTC – ellers skifter dagen midt om aftenen). */
export function dagKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function plusDage(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return dagKey(dt)
}

/** Pæn dansk dato til beskeder, fx "tirsdag den 7. oktober". */
export function pænDag(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })
}
