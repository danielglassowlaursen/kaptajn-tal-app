/// <reference types="@cloudflare/workers-types" />
// ---------------------------------------------------------------------------
// Én fælles funktion til at scanne et ark, med en adapter pr. udbyder.
// Nøglen kommer fra familiens enhed og bruges kun til dette ene kald.
// Den logges aldrig og gemmes aldrig.
// ---------------------------------------------------------------------------
import Anthropic from '@anthropic-ai/sdk'
import { TOGT_SKEMA, type RaaTogt } from './skema'

export type Udbyder = 'anthropic' | 'openai' | 'openrouter'

export interface Billede {
  type: 'image/jpeg' | 'image/png' | 'image/webp'
  data: string // base64 uden "data:"-præfiks
}

export interface ScanInput {
  udbyder: Udbyder
  model: string
  noegle: string
  system: string
  tekst: string
  billeder: Billede[]
}

export interface ScanSvar {
  raa: RaaTogt
  inputTokens: number
  outputTokens: number
}

export class ScanFejl extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message)
  }
}

/** Priser i USD pr. million tokens for de modeller, vi kender. Andre logges med pris 0. */
const PRISER: Record<string, [number, number]> = {
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
  'claude-haiku-4-5': [1, 5],
}

export function anslaaPris(model: string, input: number, output: number): number {
  const p = PRISER[model]
  return p ? (input * p[0] + output * p[1]) / 1_000_000 : 0
}

function parseJson(text: string): RaaTogt {
  const renset = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '')
  try {
    return JSON.parse(renset) as RaaTogt
  } catch {
    throw new ScanFejl('Modellen svarede ikke med gyldig JSON. Prøv igen, eller vælg en anden model.')
  }
}

// ------------------------------------------------------------ Anthropic (Claude)

async function anthropic(i: ScanInput): Promise<ScanSvar> {
  const client = new Anthropic({ apiKey: i.noegle, maxRetries: 1, timeout: 5 * 60_000 })
  // Server-side fallback ved afvisning findes på de nyeste Claude-modeller.
  const medFallback = i.model === 'claude-sonnet-5-5' || i.model === 'claude-opus-5-5'
  const params = {
    model: i.model,
    max_tokens: 32000,
    system: i.system,
    output_config: { effort: 'medium' as const, format: { type: 'json_schema' as const, schema: TOGT_SKEMA } },
    messages: [
      {
        role: 'user' as const,
        content: [
          ...i.billeder.map((b) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: b.type, data: b.data } })),
          { type: 'text' as const, text: i.tekst },
        ],
      },
    ],
    ...(medFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
  }
  try {
    // Streaming undgår timeouts ved lange svar; vi venter bare på det samlede svar.
    const msg = await client.beta.messages.stream(params as unknown as Parameters<typeof client.beta.messages.stream>[0]).finalMessage()
    if (msg.stop_reason === 'refusal') throw new ScanFejl('Modellen afviste at læse arket. Prøv med et andet foto.')
    if (msg.stop_reason === 'max_tokens') throw new ScanFejl('Svaret blev for langt. Prøv med færre opgaver ad gangen.')
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    return { raa: parseJson(text), inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens }
  } catch (e) {
    if (e instanceof ScanFejl) throw e
    if (e instanceof Anthropic.AuthenticationError) throw new ScanFejl('Anthropic afviste nøglen. Tjek at den er skrevet rigtigt.', 401)
    if (e instanceof Anthropic.PermissionDeniedError) throw new ScanFejl('Nøglen har ikke adgang til den valgte model.', 403)
    if (e instanceof Anthropic.NotFoundError) throw new ScanFejl(`Modellen "${i.model}" findes ikke hos Anthropic.`, 400)
    if (e instanceof Anthropic.RateLimitError) throw new ScanFejl('Anthropic siger, at der er for mange kald lige nu. Vent lidt, og prøv igen.', 429)
    if (e instanceof Anthropic.BadRequestError) throw new ScanFejl(`Anthropic afviste kaldet: ${e.message}`, 400)
    if (e instanceof Anthropic.APIError) throw new ScanFejl(`Anthropic svarede med fejl ${e.status ?? ''}. Prøv igen om lidt.`)
    throw new ScanFejl('Kunne ikke nå Anthropic. Prøv igen om lidt.')
  }
}

// ------------------------------------------------------------ OpenAI og OpenRouter (samme API-form)

async function chatCompletions(i: ScanInput, url: string, ekstraHeaders: Record<string, string>, navn: string): Promise<ScanSvar> {
  const body = {
    model: i.model,
    max_completion_tokens: 32000,
    response_format: { type: 'json_schema', json_schema: { name: 'togt', strict: true, schema: TOGT_SKEMA } },
    messages: [
      { role: 'system', content: i.system },
      {
        role: 'user',
        content: [
          ...i.billeder.map((b) => ({ type: 'image_url', image_url: { url: `data:${b.type};base64,${b.data}` } })),
          { type: 'text', text: i.tekst },
        ],
      },
    ],
  }
  let r: Response
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${i.noegle}`, ...ekstraHeaders },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ScanFejl(`Kunne ikke nå ${navn}. Prøv igen om lidt.`)
  }
  if (r.status === 401) throw new ScanFejl(`${navn} afviste nøglen. Tjek at den er skrevet rigtigt.`, 401)
  if (r.status === 404) throw new ScanFejl(`Modellen "${i.model}" findes ikke hos ${navn}.`, 400)
  if (r.status === 429) throw new ScanFejl(`${navn} siger, at der er for mange kald lige nu. Vent lidt, og prøv igen.`, 429)
  const j = (await r.json().catch(() => null)) as {
    choices?: { message?: { content?: string; refusal?: string }; finish_reason?: string }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
    error?: { message?: string }
  } | null
  if (!r.ok) throw new ScanFejl(`${navn} afviste kaldet: ${j?.error?.message ?? r.status}`, r.status >= 500 ? 502 : 400)
  const valg = j?.choices?.[0]
  if (valg?.message?.refusal) throw new ScanFejl('Modellen afviste at læse arket. Prøv med et andet foto.')
  if (valg?.finish_reason === 'length') throw new ScanFejl('Svaret blev for langt. Prøv med færre opgaver ad gangen.')
  const text = valg?.message?.content
  if (!text) throw new ScanFejl(`${navn} sendte et tomt svar. Vælg evt. en model, der kan læse billeder.`)
  return { raa: parseJson(text), inputTokens: j?.usage?.prompt_tokens ?? 0, outputTokens: j?.usage?.completion_tokens ?? 0 }
}

export async function scan(i: ScanInput): Promise<ScanSvar> {
  switch (i.udbyder) {
    case 'anthropic':
      return anthropic(i)
    case 'openai':
      return chatCompletions(i, 'https://api.openai.com/v1/chat/completions', {}, 'OpenAI')
    case 'openrouter':
      return chatCompletions(i, 'https://openrouter.ai/api/v1/chat/completions', { 'x-title': 'Kaptajn Tal' }, 'OpenRouter')
  }
}
