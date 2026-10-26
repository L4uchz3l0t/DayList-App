import { FunctionsHttpError } from '@supabase/supabase-js'
import { getSupabase } from '../sync/supabaseClient'
import { classifyText, planWeekWithRules } from './rules'
import type { ClassifyResult, PlanWeekRequest, PlanWeekResult, Proposal } from './types'

/*
  Hier fragt die App ihre KI. Gibt es in Supabase den Dienst "ai" (supabase/functions/ai), antwortet der.
  Fehlt er oder sagt er "not-implemented", antworten die Regeln auf dem Gerät (rules.ts).
*/

const FUNCTION_NAME = 'ai'

/** Wer geantwortet hat: dein Dienst in der Cloud oder die Regeln auf dem Gerät */
export type AnswerSource = 'cloud' | 'device'

export class AssistantError extends Error {}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Fragt den Dienst in der Cloud. `null` heißt: kein eigener Dienst da, die Regeln sollen antworten.
 * Ohne Anmeldung gibt es ebenfalls null, weil der Dienst nur angemeldete Nutzer bedient.
 */
async function askCloud<T>(body: object, signedIn: boolean): Promise<T | null> {
  if (!signedIn) return null
  const supabase = await getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.functions.invoke<T>(FUNCTION_NAME, { body })
  if (!error) return data
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response
    const answer = (await response.json().catch(() => ({}))) as { error?: string }
    if ((response.status === 404 && !answer.error) || answer.error === 'not-implemented') return null
    throw new AssistantError(answer.error ?? `${response.status}`)
  }
  throw new AssistantError(error.message)
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/

/** Prüft die Antwort einer KI, bevor die App ihr glaubt. Unbrauchbare Vorschläge fallen weg. */
export function checkPlan(raw: unknown): PlanWeekResult {
  const value = (raw ?? {}) as { proposals?: unknown; question?: unknown }
  const proposals: Proposal[] = []
  for (const item of Array.isArray(value.proposals) ? value.proposals : []) {
    const p = (item ?? {}) as Record<string, unknown>
    if (typeof p.title !== 'string' || p.title.trim() === '' || typeof p.date !== 'string' || !DATE.test(p.date)) continue
    const proposal: Proposal = { title: p.title.trim().slice(0, 200), kind: p.kind === 'event' ? 'event' : 'task', date: p.date }
    if (typeof p.time === 'string' && TIME.test(p.time)) proposal.time = p.time
    if (typeof p.durationMinutes === 'number' && p.durationMinutes > 0) proposal.durationMinutes = Math.round(p.durationMinutes)
    if (typeof p.reason === 'string') proposal.reason = p.reason.slice(0, 200)
    proposals.push(proposal)
  }
  const result: PlanWeekResult = { proposals }
  if (typeof value.question === 'string' && value.question.trim() !== '') result.question = value.question.trim()
  return result
}

export async function planWeek(
  request: PlanWeekRequest,
  options: { signedIn: boolean; language: 'de' | 'en' },
): Promise<{ result: PlanWeekResult; source: AnswerSource }> {
  const fromCloud = await askCloud<unknown>(request, options.signedIn)
  if (fromCloud !== null) return { result: checkPlan(fromCloud), source: 'cloud' }
  return { result: planWeekWithRules(request, options.language), source: 'device' }
}

/**
 * Aufgabe oder Termin? Läuft beim Tippen in der Schnellaufnahme, deshalb immer sofort auf dem Gerät.
 * Ein eigenes kleines Modell auf dem Gerät würde genau hier eingesetzt.
 */
export function classify(text: string, today: string): ClassifyResult {
  return classifyText(text, today)
}
