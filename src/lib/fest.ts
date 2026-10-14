// Lille event-bus til konfetti, så enhver komponent kan fyre et udbrud af
// uden at kende KonfettiLag. 'guld' = lille udbrud, 'stor' = stort.
// Hvert udbrud følges af sejrs-fanfaren.
import { afspil } from './lyd'

export type Fest = 'guld' | 'stor'

export const FEST_EVENT = 'kaptajn-fest'

export function fest(type: Fest) {
  afspil('sejr')
  window.dispatchEvent(new CustomEvent<Fest>(FEST_EVENT, { detail: type }))
}
