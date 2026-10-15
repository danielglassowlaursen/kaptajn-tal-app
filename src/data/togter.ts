// ---------------------------------------------------------------------------
// Togter. Appen leveres uden opgaver – familier scanner deres egne regneark
// (kommer i fase 2). Indtil da findes kun prøvetogtet herunder, som er skrevet
// fra bunden til Kaptajn Tal og kan bruges frit under projektets licens.
// Se src/types.ts for alle opgavetyper.
// ---------------------------------------------------------------------------
import type { Togt } from '../types'
import type { TemaId } from '../tema'

const DEMO_PIRAT: Togt[] = [
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

// Samme regnestykker, facit og id'er som pirat-udgaven – kun historierne er anderledes,
// så fremgangen på prøvetogtet følger med, hvis familien skifter tema.
const PRINSESSE_TEKST: Record<string, { story: string; question?: string }> = {
  'demo-01': { story: 'Prinsessen har 245 ædelsten i sit skrin. I rosenhaven finder hun en lille æske med 38 ædelsten mere.', question: 'Hvor mange ædelsten har prinsessen nu?' },
  'demo-02': { story: 'Enhjørningen Luna tæller stjerner på himlen, men hun springer nogle af dem over.' },
  'demo-03': { story: 'To skatkister står i slotssalen. Hvilken rummer flest perler?' },
  'demo-04': { story: 'Prinsessens nye kjole har 8 felter. Hun vil sy glimmer på 1/4 af felterne.', question: 'Tryk på de felter, der skal have glimmer.' },
  'demo-05': { story: 'Den gyldne krone er gemt i slotshaven. Stedet er markeret med et X på kortet.', question: 'Hvad er kronens koordinater (x ; y)?' },
}

const DEMO_PRINSESSE: Togt[] = DEMO_PIRAT.map((t) => ({
  ...t,
  title: 'Rosenslottet',
  emoji: '🌹',
  intro: 'Et lille prøve-eventyr med fem opgaver, så du kan se, hvordan appen virker. Rigtige eventyr laver du ved at scanne dit eget regneark.',
  opgaver: t.opgaver.map((o) => ({
    ...o,
    ...PRINSESSE_TEKST[o.id],
    hints: o.hints?.map((h) => h.replace('mønter', 'ædelsten').replace('kanonkugler', 'stjerner')),
  })),
}))

const RUM_TEKST: Record<string, { story: string; question?: string }> = {
  'demo-01': { story: 'Raketten har 245 stjernestøv i lastrummet. På en komet samler kommandøren 38 stjernestøv mere.', question: 'Hvor meget stjernestøv er der i lastrummet nu?' },
  'demo-02': { story: 'Robotten Bip tæller satellitter i kredsløb, men springer nogle af dem over.' },
  'demo-03': { story: 'To rumkapsler er fyldt med månesten. Hvilken har flest?' },
  'demo-04': { story: 'Rumstationens solpanel har 8 felter. Bip skal pudse 1/4 af felterne.', question: 'Tryk på de felter, der skal pudses.' },
  'demo-05': { story: 'Den forsvundne satellit er markeret med et X på stjernekortet.', question: 'Hvad er satellittens koordinater (x ; y)?' },
}

const DEMO_RUM: Togt[] = DEMO_PIRAT.map((t) => ({
  ...t,
  title: 'Månebasen',
  emoji: '🌙',
  intro: 'En lille prøvemission med fem opgaver, så du kan se, hvordan appen virker. Rigtige missioner laver du ved at scanne dit eget regneark.',
  opgaver: t.opgaver.map((o) => ({
    ...o,
    ...RUM_TEKST[o.id],
    hints: o.hints?.map((h) => h.replace('mønter', 'stjernestøv').replace('kanonkugler', 'satellitter')),
  })),
}))

/** Prøvetogtet i det valgte tema. */
export function demoTogter(tema: TemaId): Togt[] {
  return tema === 'prinsesse' ? DEMO_PRINSESSE : tema === 'rum' ? DEMO_RUM : DEMO_PIRAT
}

/** Id'er der er reserveret til indbyggede togter. */
export const DEMO_IDS = new Set(DEMO_PIRAT.map((t) => t.id))
