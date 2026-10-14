// ---------------------------------------------------------------------------
// Skibe, besætningsnavne og Pollys/Sorte Svens replikker.
// ---------------------------------------------------------------------------

export interface Skib {
  navn: string
  emoji: string
  /** Så mange besætningsmedlemmer skal man have for at få skibet. */
  crew: number
}

/** Flåden vokser, efterhånden som besætningen vokser. Første skib har man altid. */
export const SKIBE: Skib[] = [
  { navn: 'Jollen', emoji: '🛶', crew: 0 },
  { navn: 'Sluppen', emoji: '⛵', crew: 3 },
  { navn: 'Briggen', emoji: '🚤', crew: 6 },
  { navn: 'Fregatten', emoji: '🛥️', crew: 10 },
  { navn: 'Galeonen', emoji: '🚢', crew: 15 },
  { navn: 'Den Sorte Perle', emoji: '🏴‍☠️', crew: 21 },
  { navn: 'Dronningens Hævn', emoji: '⛴️', crew: 28 },
]

export const CREW_NAVNE = [
  'Enøjede Erik',
  'Tandløse Tulle',
  'Bjarne Bøf',
  'Sømanden Sofie',
  'Krogen Karl',
  'Skæve Signe',
  'Store Stig',
  'Lille Lasse',
  'Kokken Kurt',
  'Anker-Anna',
  'Kanon-Kasper',
  'Sejl-Sara',
  'Tønde-Tobias',
  'Kompas-Kim',
  'Lanterne-Line',
  'Fiske-Frede',
  'Styrmand Søren',
  'Vagt-Viggo',
  'Bølge-Bo',
  'Harpun-Hanne',
  'Knob-Kaj',
  'Skatte-Sanne',
  'Mast-Mads',
  'Dæks-Dorte',
  'Reb-Rasmus',
  'Tågehorn-Tina',
  'Kikkert-Klaus',
  'Fregat-Frida',
]

export const CREW_EMOJI = ['🧔', '👩‍🦰', '👨‍🦲', '🧑‍🦱', '👩', '🧓', '👦', '👧', '👨‍🦳', '👩‍🦱']

export const PRAISE = [
  'Arrr, flot klaret!',
  'Sådan, kaptajn!',
  'Skibet holder kursen!',
  'Perfekt – Polly jubler!',
  'Du er en ægte sørøver!',
  'Fuld fart frem!',
]

/** Pollys friske bemærkning, lige før hun afslører svaret. */
export const POLLY_AFSLOERING = [
  'Arrr, godt så! Men kun fordi du spurgte pænt.',
  'Polly vil have en kiks for det her!',
  'Hemmeligheden er … trommehvirvel …',
  'Jeg siger det, men du regner det selv næste gang, ikke?',
  'Pyha, min papegøjehjerne er lille, men okay:',
  'Sig det ikke til kaptajnen, men svaret er:',
  'Kraaak! Fint, jeg hvisker det:',
]

/** Sorte Sven – den rivaliserende pirat, der holder øje med din skat. */
export const SVEN = {
  navn: 'Sorte Sven',
  emoji: '😈',
  stjalFraSkat: (n: number) => `Sorte Sven så, hvor du gravede! Han snuppede ${n} guldmønter fra din skat.`,
  stjalFraPung: (n: number) => `Sorte Sven sneg sig ombord og snuppede ${n} guldmønter fra din pung!`,
  fandtIntet: 'Sorte Sven ledte efter din skat, men fandt ingenting. Pyha!',
}
