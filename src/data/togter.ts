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

// Prøvetogt for udskolingen (temaerne detektiv, sport og flyt hjemmefra). Viser de nye
// opgavetyper: ligning, andengradsligning, brøk, udtryk, Pythagoras med afrunding og graf.
const UDSKOLING_GRUND: Togt = {
  id: 'demo-udskoling',
  title: '',
  subtitle: 'Prøvetogt',
  emoji: '',
  intro: '',
  opgaver: [
      { id: 'u-01', type: 'tal', nr: 1, story: '', question: '', regnestykke: '3x + 7 = 22', answer: 5,
        hints: ['Få x til at stå alene. Hvad skal væk først?', 'Træk 7 fra på begge sider, så står der 3x = 15. Hvad skal x så være?'] },
      { id: 'u-02', type: 'flere', nr: 2, story: '', question: 'Hvilke tal løser ligningen?', regnestykke: 'x^2 - 5x + 6 = 0', answers: [2, 3], variabel: 'x',
        hints: ['En andengradsligning kan have to løsninger. Find to tal, der ganget giver 6 og lagt sammen giver 5.', 'Skriv ligningen som (x − a)(x − b) = 0, hvor a · b = 6 og a + b = 5. Prøv dig frem med små tal.'] },
      { id: 'u-03', type: 'broek', nr: 3, story: '', question: '', regnestykke: '2/3 + 1/6', answer: [5, 6], forkortet: true,
        hints: ['Gør nævnerne ens, før du lægger sammen.', 'Omskriv 2/3 til sjettedele: 2/3 = 4/6. Læg så 1/6 til, og forkort til sidst, hvis du kan.'] },
      { id: 'u-04', type: 'udtryk', nr: 4, story: '', question: 'Reducér udtrykket.', regnestykke: '3(x + 2) - x', answer: '2x + 6',
        hints: ['Gang parentesen ud først.', '3(x + 2) = 3x + 6. Træk derefter x fra 3x.'] },
      { id: 'u-05', type: 'tal', nr: 5, story: '', question: '', regnestykke: 'sqrt(4^2 + 7^2)', answer: Math.sqrt(65), decimaler: 1,
        hints: ['Det er en retvinklet trekant. Hvilken sætning bruger man til den længste side?', 'Brug Pythagoras: læg 4² og 7² sammen, og tag kvadratroden af resultatet.'] },
      { id: 'u-06', type: 'tal', nr: 6, story: '', question: '', regnestykke: '2x - 3 = 0', answer: 1.5,
        visual: { kind: 'graf', funktioner: ['2x - 3'], xMin: -2, xMax: 5, yMin: -5, yMax: 6 },
        hints: ['Hvad er y, der hvor en linje rammer x-aksen?', 'Sæt 2x − 3 = 0. Læg 3 til på begge sider, og del så med 2.'] },
    ] as Togt['opgaver'],
}

type Tekster = Record<string, { story: string; question?: string; unit?: string }>

function udskoling(title: string, emoji: string, intro: string, tekster: Tekster): Togt[] {
  return [
    {
      ...UDSKOLING_GRUND,
      title,
      emoji,
      intro,
      opgaver: UDSKOLING_GRUND.opgaver.map((o) => ({ ...o, ...tekster[o.id], question: tekster[o.id]?.question ?? o.question })) as Togt['opgaver'],
    },
  ]
}

const DEMO_DETEKTIV = udskoling('Sagen om det tomme pengeskab', '🔐', 'En prøvesag med seks opgaver fra udskolingen. Rigtige sager laver du ved at scanne dit eget regneark.', {
  'u-01': { story: 'Tyven efterlod 3 ens nøgleknipper og 7 løse nøgler – i alt 22 nøgler.', question: 'Hvor mange nøgler sidder der på hvert knippe? (Find x)' },
  'u-02': { story: 'Koden til pengeskabet er løsningerne til ligningen på en krøllet seddel.' },
  'u-03': { story: 'Rex har snuset 2/3 af gyden igennem og derefter 1/6 mere.', question: 'Hvor stor en del af gyden har Rex undersøgt? Skriv som forkortet brøk.' },
  'u-04': { story: 'I den mistænktes notesbog står udtrykket 3(x + 2) − x. Det skal gøres kortere, før det giver mening.' },
  'u-05': { story: 'Tyven løb 4 km mod øst og derefter 7 km mod nord.', question: 'Hvor langt er der i fugleflugt fra start til slut? Afrund til én decimal.', unit: 'km' },
  'u-06': { story: 'Overvågningskameraet viser tyvens rute som linjen y = 2x − 3.', question: 'Ved hvilken x-værdi krydser ruten x-aksen?' },
})

const DEMO_SPORT = udskoling('Cupfinalen', '⚽', 'En prøvekamp med seks opgaver fra udskolingen. Rigtige kampe laver du ved at scanne dit eget regneark.', {
  'u-01': { story: 'Holdet fik samme antal point i 3 kampe og 7 bonuspoint – i alt 22 point.', question: 'Hvor mange point fik holdet pr. kamp? (Find x)' },
  'u-02': { story: 'Trænerens taktiktavle viser en ligning. Løsningerne er numrene på de to spillere, der skal starte.' },
  'u-03': { story: 'Løberen har gennemført 2/3 af banen og derefter 1/6 mere.', question: 'Hvor stor en del af banen har hun løbet? Skriv som forkortet brøk.' },
  'u-04': { story: 'Statistikeren har skrevet antallet af afleveringer som 3(x + 2) − x.' },
  'u-05': { story: 'Kantspilleren løber 4 m langs sidelinjen og 7 m ind mod banen.', question: 'Hvor langt er der i lige linje? Afrund til én decimal.', unit: 'm' },
  'u-06': { story: 'Boldens bane i et skud tegnes som linjen y = 2x − 3.', question: 'Ved hvilken x-værdi rammer linjen x-aksen?' },
})

const DEMO_FLYT = udskoling('Første måned i egen lejlighed', '📦', 'En prøvemåned med seks opgaver fra udskolingen. Rigtige måneder laver du ved at scanne dit eget regneark.', {
  'u-01': { story: 'Du har 3 ens streamingtjenester og betaler 7 kr. i gebyr. I alt koster det 22 kr. om ugen.', question: 'Hvad koster én tjeneste om ugen? (Find x)', unit: 'kr.' },
  'u-02': { story: 'I en øvelse om lån bruger banken ligningen her. Løsningerne er antal år.' },
  'u-03': { story: 'Du bruger 2/3 af lønnen på husleje og mad og 1/6 på transport.', question: 'Hvor stor en del af lønnen er brugt? Skriv som forkortet brøk.' },
  'u-04': { story: 'Din mobilregning er 3(x + 2) − x kr., hvor x er antal GB, du bruger.' },
  'u-05': { story: 'Fra lejligheden cykler du 4 km mod øst og 7 km mod nord til arbejde.', question: 'Hvor langt er der i fugleflugt? Afrund til én decimal.', unit: 'km' },
  'u-06': { story: 'Din opsparing følger linjen y = 2x − 3 (tusind kr. efter x måneder).', question: 'Efter hvor mange måneder står opsparingen præcis på 0 kr.?' },
})

/** Prøvetogtet i det valgte tema. */
export function demoTogter(tema: TemaId): Togt[] {
  if (tema === 'detektiv') return DEMO_DETEKTIV
  if (tema === 'sport') return DEMO_SPORT
  if (tema === 'flyt') return DEMO_FLYT
  return tema === 'prinsesse' ? DEMO_PRINSESSE : tema === 'rum' ? DEMO_RUM : DEMO_PIRAT
}

/** Id'er der er reserveret til indbyggede togter. */
export const DEMO_IDS = new Set([...DEMO_PIRAT.map((t) => t.id), UDSKOLING_GRUND.id])
