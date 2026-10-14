// ---------------------------------------------------------------------------
// AI-indstillinger: udbyder, model og familiens egen nøgle. Gemmes KUN på denne
// enhed. Nøglen sendes gennem vores server ved hver scanning og gemmes ikke der.
// ---------------------------------------------------------------------------
export type Udbyder = 'anthropic' | 'openai' | 'openrouter'

export interface AiIndstillinger {
  udbyder: Udbyder
  modeller: Record<Udbyder, string>
  noegler: Partial<Record<Udbyder, string>>
}

export const UDBYDER_INFO: Record<Udbyder, { navn: string; noegleSide: string; modelForslag: string[]; modelHjaelp: string }> = {
  anthropic: {
    navn: 'Anthropic (Claude)',
    noegleSide: 'https://console.anthropic.com/settings/keys',
    modelForslag: ['claude-sonnet-5-5', 'claude-opus-5-5'],
    modelHjaelp: 'Sonnet 5.5 er hurtig og billig (ca. 1 kr. pr. ark). Opus 5.5 er grundigere og cirka dobbelt så dyr.',
  },
  openai: {
    navn: 'OpenAI',
    noegleSide: 'https://platform.openai.com/api-keys',
    modelForslag: [],
    modelHjaelp: 'Skriv navnet på en OpenAI-model, der kan læse billeder og levere JSON efter et skema.',
  },
  openrouter: {
    navn: 'OpenRouter',
    noegleSide: 'https://openrouter.ai/keys',
    modelForslag: [],
    modelHjaelp: 'Skriv modellens navn som på openrouter.ai/models. Den skal kunne læse billeder og levere JSON efter et skema.',
  },
}

const KEY = 'kaptajn-tal-ai-v1'

export const STANDARD: AiIndstillinger = {
  udbyder: 'anthropic',
  modeller: { anthropic: 'claude-sonnet-5-5', openai: '', openrouter: '' },
  noegler: {},
}

export function loadAi(): AiIndstillinger {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const a = JSON.parse(raw) as Partial<AiIndstillinger>
      return { ...STANDARD, ...a, modeller: { ...STANDARD.modeller, ...a.modeller }, noegler: { ...a.noegler } }
    }
  } catch {
    /* ignorer */
  }
  return { ...STANDARD, modeller: { ...STANDARD.modeller }, noegler: {} }
}

export function saveAi(a: AiIndstillinger) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    /* ignorer */
  }
}

export function klarTilScan(a: AiIndstillinger): string | null {
  if (!a.noegler[a.udbyder]?.trim()) return 'Indsæt din API-nøgle.'
  if (!a.modeller[a.udbyder]?.trim()) return 'Skriv navnet på modellen.'
  return null
}

/** Skjul det meste af nøglen, når den vises. */
export function maskeret(n: string): string {
  return n.length <= 10 ? '••••' : `${n.slice(0, 6)}…${n.slice(-4)}`
}
