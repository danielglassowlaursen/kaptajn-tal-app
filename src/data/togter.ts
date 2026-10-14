// ---------------------------------------------------------------------------
// Togter. Appen leveres uden opgaver – familier scanner deres egne regneark
// (kommer i fase 2). Indtil da findes kun prøvetogtet herunder, som er skrevet
// fra bunden til Kaptajn Tal og kan bruges frit under projektets licens.
// Se src/types.ts for alle opgavetyper.
// ---------------------------------------------------------------------------
import type { Togt } from '../types'

export const togter: Togt[] = [
  {
    id: 'demo',
    title: 'Skildpaddeøen',
    subtitle: 'Prøvetogt',
    emoji: '🐢',
    intro:
      'Et lille prøvetogt med fem opgaver, så du kan se, hvordan Kaptajn Tal virker. Rigtige togter laver du ved at scanne dit eget regneark.',
    opgaver: [
      {
        id: 'demo-01',
        type: 'tal',
        nr: 1,
        story: 'Kaptajnen har 245 guldmønter i kisten. På Skildpaddeøen finder hun en lille kiste med 38 mønter mere.',
        question: 'Hvor mange guldmønter har kaptajnen nu?',
        regnestykke: '245 + 38',
        answer: 283,
        hints: [
          'Der kommer mønter TIL. Skal du lægge sammen eller trække fra?',
          'Del 38 op i 30 og 8. Læg først de 30 til 245, og læg så de 8 til bagefter.',
        ],
      },
      {
        id: 'demo-02',
        type: 'talraekke',
        nr: 2,
        story: 'Papegøjen Polly tæller kanonkugler i stakke. Hun springer nogle af stakkene over.',
        question: 'Udfyld de tomme felter i talrækken.',
        sequence: [14, 21, null, 35, null],
        answers: [28, 42],
        hints: [
          'Kig på de to første tal. Hvor stort er hoppet fra det ene til det næste?',
          'Fra 14 til 21 er hoppet 7. Tæl 7 frem fra 21, og tæl 7 frem fra 35.',
        ],
      },
      {
        id: 'demo-03',
        type: 'sammenlign',
        nr: 3,
        story: 'To skattekister er skyllet op på stranden. Hvilken rummer flest perler?',
        question: 'Sæt >, < eller = mellem kisterne.',
        left: '4 · 8',
        right: '50 − 17',
        answer: '<',
        hints: [
          'Regn hver kiste ud for sig selv først. Så kan du sammenligne.',
          'Regn 4 · 8 ud, og regn 50 − 17 ud. Det åbne gab i > og < vender altid mod det største tal.',
        ],
      },
      {
        id: 'demo-04',
        type: 'felter',
        nr: 4,
        story: 'Skibets nye sejl har 8 felter. Piraterne vil male 1/4 af felterne sorte.',
        question: 'Tryk på de felter, der skal males.',
        total: 8,
        cols: 4,
        answer: 2,
        hints: [
          '1/4 betyder at dele i 4 lige store bunker. Hvor mange felter er der i hver bunke?',
          'Del de 8 felter i 4 lige store bunker: Regn 8 : 4. Så mange felter skal du trykke på.',
        ],
      },
      {
        id: 'demo-05',
        type: 'koordinat',
        nr: 5,
        story: 'Skatten på Skildpaddeøen er markeret med et X på kortet.',
        question: 'Hvad er skattens koordinater (x ; y)?',
        answer: [3, 2],
        visual: { kind: 'koordinat', size: 5, marker: [3, 2] },
        hints: [
          'Gå først til højre langs bunden, og tæl. Gå så opad, og tæl.',
          'Start i (0;0) nede i hjørnet. Tæl felterne til højre, til du står lige under krydset – det er x. Tæl så opad til krydset – det er y.',
        ],
      },
    ],
  },
]

/** Hjælper: find et togt ud fra id. */
export function findTogt(id: string): Togt | undefined {
  return togter.find((t) => t.id === id)
}
