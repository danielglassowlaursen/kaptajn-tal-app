// ---------------------------------------------------------------------------
// Alle "knapper" der styrer spillet. Justér her – ikke i komponenterne.
// ---------------------------------------------------------------------------
export const CONFIG = {
  /** Guld for rigtigt svar i første forsøg (uden fejl). */
  guldFoersteForsoeg: 10,
  /** Guld for rigtigt svar i andet forsøg (efter Pollys første hint). */
  guldAndetForsoeg: 5,
  /** Så meget snupper Sorte Sven, når en opgave løses forkert (to forkerte svar). */
  tyveri: 5,

  /** Dagligt mål: så mange sekunders matematik giver et nyt besætningsmedlem. */
  dagligtMaalSek: 10 * 60,

  /** Tabel-træning før man må ro i land og begrave. Hvilke tabeller trækkes der fra? */
  tabeller: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  /** Antal rigtige svar, der kræves i tabel-træningen. */
  tabelSpoergsmaal: 10,
}
