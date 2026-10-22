import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from '../sync/supabaseClient'
import type { Group, GroupMember, GroupRole, GroupSeries, GroupTask } from './types'

/*
  Lesen und Schreiben der Gruppen in Supabase. Was jemand sehen und ändern darf,
  prüft die Datenbank selbst (Regeln in supabase/groups.sql); hier wird nur angefragt.
*/

async function connect(): Promise<SupabaseClient> {
  const client = getSupabase()
  if (!client) throw new Error('Cloud nicht eingerichtet')
  return client
}

/** Fehler von Supabase weiterreichen, sonst die Daten liefern */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

/** Fehlt die Tabelle (Skript noch nicht ausgeführt), meldet Supabase diesen Code */
export function isMissingSetup(error: unknown): boolean {
  const { code } = (error ?? {}) as { code?: string }
  return code === '42P01' || code === 'PGRST205' || code === 'PGRST202'
}

/** Ältere erledigte Aufgaben werden nicht mehr geladen */
const KEEP_DONE_DAYS = 30

/**
 * Lädt alle Gruppen, in denen man Mitglied ist, mit Mitgliedern, Aufgaben und Wiederholungen.
 * Vorher werden Einladungen an die eigene Adresse angenommen und fällige Runden angelegt.
 */
export async function loadGroups(): Promise<Group[]> {
  const supabase = await connect()
  check(await supabase.rpc('claim_group_invites'))
  check(await supabase.rpc('generate_group_tasks'))

  const since = new Date(Date.now() - KEEP_DONE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [groups, members, series, tasks] = await Promise.all([
    supabase.from('groups').select('id, name, timezone').order('created_at'),
    supabase.from('group_members').select('group_id, email, display_name, user_id, role, show_in_calendar').order('created_at'),
    supabase.from('group_series').select('id, group_id, title, interval_weeks, rotation, first_due, time, reminder, active'),
    supabase
      .from('group_tasks')
      .select('id, group_id, title, assignee, due_date, time, reminder, done_at, series_id, occurrence, skipped')
      .or(`done_at.is.null,due_date.gte.${since}`)
      .order('due_date'),
  ])
  const memberRows = check(members) as GroupMember[]
  const seriesRows = check(series) as GroupSeries[]
  const taskRows = check(tasks) as GroupTask[]
  return (check(groups) as { id: string; name: string; timezone: string }[]).map((group) => ({
    ...group,
    members: memberRows.filter((row) => row.group_id === group.id),
    series: seriesRows.filter((row) => row.group_id === group.id),
    tasks: taskRows.filter((row) => row.group_id === group.id),
  }))
}

/** Zeitzone dieses Geräts für die Uhrzeiten der Gruppe */
function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'
  } catch {
    return 'Europe/Berlin'
  }
}

export async function createGroup(name: string, myName: string): Promise<string> {
  const supabase = await connect()
  return check(await supabase.rpc('create_group', { group_name: name, my_name: myName, tz: deviceTimezone() })) as string
}

export async function renameGroup(groupId: string, name: string) {
  const supabase = await connect()
  check(await supabase.from('groups').update({ name }).eq('id', groupId))
}

export async function deleteGroup(groupId: string) {
  const supabase = await connect()
  check(await supabase.from('groups').delete().eq('id', groupId))
}

export async function inviteMember(groupId: string, email: string, displayName: string) {
  const supabase = await connect()
  check(
    await supabase
      .from('group_members')
      .insert({ group_id: groupId, email: email.trim().toLowerCase(), display_name: displayName.trim() }),
  )
}

export async function setMemberRole(groupId: string, email: string, role: GroupRole) {
  const supabase = await connect()
  check(await supabase.from('group_members').update({ role }).eq('group_id', groupId).eq('email', email))
}

/** Mitglied entfernen; mit der eigenen Adresse heißt das: Gruppe verlassen */
export async function removeMember(groupId: string, email: string) {
  const supabase = await connect()
  check(await supabase.from('group_members').delete().eq('group_id', groupId).eq('email', email))
}

export async function setShowInCalendar(groupId: string, show: boolean) {
  const supabase = await connect()
  check(await supabase.rpc('set_group_calendar', { gid: groupId, show }))
}

export interface GroupTaskInput {
  title: string
  assignee: string
  due_date: string
  time: string | null
  reminder: number | null
}

export async function addGroupTask(groupId: string, input: GroupTaskInput) {
  const supabase = await connect()
  check(await supabase.from('group_tasks').insert({ group_id: groupId, ...input }))
}

/** Eine Aufgabe ändern; bei wiederkehrenden Aufgaben nur diese eine Runde */
export async function updateGroupTask(taskId: string, changes: Partial<GroupTaskInput> & { skipped?: boolean }) {
  const supabase = await connect()
  check(await supabase.from('group_tasks').update(changes).eq('id', taskId))
}

export async function deleteGroupTask(taskId: string) {
  const supabase = await connect()
  check(await supabase.from('group_tasks').delete().eq('id', taskId))
}

export async function setGroupTaskDone(taskId: string, done: boolean) {
  const supabase = await connect()
  check(await supabase.rpc('set_group_task_done', { task_id: taskId, done }))
}

export interface GroupSeriesInput {
  title: string
  interval_weeks: number
  rotation: string[]
  first_due: string
  time: string | null
  reminder: number | null
}

/** Wiederkehrende Aufgabe anlegen; die ersten Runden entstehen sofort */
export async function addGroupSeries(groupId: string, input: GroupSeriesInput) {
  const supabase = await connect()
  check(await supabase.from('group_series').insert({ group_id: groupId, ...input }))
  check(await supabase.rpc('generate_group_tasks'))
}

/** Reihenfolge oder Rhythmus ändern; gilt für Runden, die noch nicht angelegt sind */
export async function updateGroupSeries(seriesId: string, changes: Partial<GroupSeriesInput>) {
  const supabase = await connect()
  check(await supabase.from('group_series').update(changes).eq('id', seriesId))
}

/** Wiederholung beenden: keine neuen Runden mehr, offene Runden in der Zukunft verschwinden */
export async function stopGroupSeries(seriesId: string, todayKey: string) {
  const supabase = await connect()
  check(await supabase.from('group_series').update({ active: false }).eq('id', seriesId))
  check(
    await supabase.from('group_tasks').delete().eq('series_id', seriesId).is('done_at', null).gt('due_date', todayKey),
  )
}
