/**
 * Local storage data layer — all calendar data lives in the browser.
 * Keys are namespaced under "cal:" to avoid collisions.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalCategory {
  id: number
  name: string
  color: string
  createdAt: string
}

export interface LocalTag {
  id: number
  name: string
  color: string
  createdAt: string
}

export interface LocalEvent {
  id: number
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  description?: string | null
  location?: string | null
  categoryId?: number | null
  tagIds: number[]
  createdAt: string
  updatedAt: string
  // Computed / joined fields (populated by listEvents)
  color?: string
  category?: { id: number; name: string; color: string }
  tags?: { id: number; name: string; color: string }[]
  reminders?: { id: number; minutesBefore: number }[]
}

export interface LocalReminder {
  id: number
  eventId: number
  minutesBefore: number
  createdAt: string
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  categories: 'cal:categories',
  tags:       'cal:tags',
  events:     'cal:events',
  reminders:  'cal:reminders',
  ids:        'cal:ids',
} as const

// ─── ID generator ─────────────────────────────────────────────────────────────

function nextId(entity: string): number {
  const map: Record<string, number> = JSON.parse(localStorage.getItem(KEYS.ids) || '{}')
  const id = (map[entity] ?? 0) + 1
  map[entity] = id
  localStorage.setItem(KEYS.ids, JSON.stringify(map))
  return id
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') }
  catch { return [] }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

// ─── Seed defaults (runs once on first load) ──────────────────────────────────

const DEFAULT_CATEGORIES: Omit<LocalCategory, 'id' | 'createdAt'>[] = [
  { name: '工作', color: '#007aff' },
  { name: '个人', color: '#34c759' },
  { name: '家庭', color: '#ff9500' },
  { name: '健康', color: '#ff3b30' },
  { name: '学习', color: '#5856d6' },
]

const DEFAULT_TAGS: Omit<LocalTag, 'id' | 'createdAt'>[] = [
  { name: '重要',   color: '#ff3b30' },
  { name: '会议',   color: '#007aff' },
  { name: '截止日期', color: '#ff9500' },
  { name: '提醒',   color: '#ffcc00' },
  { name: '外出',   color: '#34c759' },
]

export function seedIfEmpty(): void {
  const now = new Date().toISOString()

  if (load(KEYS.categories).length === 0) {
    const cats = DEFAULT_CATEGORIES.map(c => ({ ...c, id: nextId('category'), createdAt: now }))
    save(KEYS.categories, cats)
  }

  if (load(KEYS.tags).length === 0) {
    const tags = DEFAULT_TAGS.map(t => ({ ...t, id: nextId('tag'), createdAt: now }))
    save(KEYS.tags, tags)
  }
}

/**
 * One-time migration: fetch all data from the legacy API server and write it
 * into localStorage. Skips silently if localStorage already has events, or if
 * the API is unreachable. Returns true when data was actually imported.
 */
export async function migrateFromApiIfEmpty(): Promise<boolean> {
  if (load<LocalEvent>(KEYS.events).length > 0) return false

  try {
    const [evRes, catRes, tagRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/categories'),
      fetch('/api/tags'),
    ])
    if (!evRes.ok || !catRes.ok || !tagRes.ok) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [apiEvents, apiCats, apiTags]: [any[], any[], any[]] = await Promise.all([
      evRes.json(), catRes.json(), tagRes.json(),
    ])

    // Map and persist categories
    const cats: LocalCategory[] = apiCats.map(c => ({
      id: c.id, name: c.name, color: c.color, createdAt: c.createdAt,
    }))
    save(KEYS.categories, cats)

    // Map and persist tags
    const tags: LocalTag[] = apiTags.map(t => ({
      id: t.id, name: t.name, color: t.color, createdAt: t.createdAt,
    }))
    save(KEYS.tags, tags)

    // Map and persist events (strip joined fields; keep flat ids)
    const events: LocalEvent[] = apiEvents.map(e => ({
      id:          e.id,
      title:       e.title,
      startDate:   e.startDate,
      endDate:     e.endDate,
      allDay:      e.allDay,
      description: e.description ?? null,
      location:    e.location   ?? null,
      categoryId:  e.categoryId ?? null,
      tagIds:      Array.isArray(e.tagIds) ? e.tagIds : [],
      createdAt:   e.createdAt,
      updatedAt:   e.updatedAt,
    }))
    save(KEYS.events, events)

    // Map and persist reminders (embedded in each event)
    const reminders: LocalReminder[] = apiEvents.flatMap(e =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e.reminders ?? []).map((r: any) => ({
        id: r.id, eventId: r.eventId, minutesBefore: r.minutesBefore, createdAt: r.createdAt,
      }))
    )
    save(KEYS.reminders, reminders)

    // Advance ID counters so new items don't collide with migrated ones
    const maxId = (arr: { id: number }[]) => arr.length ? Math.max(...arr.map(x => x.id)) : 0
    localStorage.setItem(KEYS.ids, JSON.stringify({
      category: maxId(cats),
      tag:      maxId(tags),
      event:    maxId(events),
      reminder: maxId(reminders),
    }))

    return true
  } catch {
    return false
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function listCategories(): LocalCategory[] {
  return load<LocalCategory>(KEYS.categories)
}

export function createCategory(data: { name: string; color: string }): LocalCategory {
  const item: LocalCategory = { ...data, id: nextId('category'), createdAt: new Date().toISOString() }
  save(KEYS.categories, [...load<LocalCategory>(KEYS.categories), item])
  return item
}

export function updateCategory(id: number, data: Partial<Pick<LocalCategory, 'name' | 'color'>>): LocalCategory {
  const all = load<LocalCategory>(KEYS.categories).map(c => c.id === id ? { ...c, ...data } : c)
  save(KEYS.categories, all)
  return all.find(c => c.id === id)!
}

export function deleteCategory(id: number): void {
  save(KEYS.categories, load<LocalCategory>(KEYS.categories).filter(c => c.id !== id))
  // Unlink from events
  const events = load<LocalEvent>(KEYS.events).map(e =>
    e.categoryId === id ? { ...e, categoryId: null } : e
  )
  save(KEYS.events, events)
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export function listTags(): LocalTag[] {
  return load<LocalTag>(KEYS.tags)
}

export function createTag(data: { name: string; color: string }): LocalTag {
  const item: LocalTag = { ...data, id: nextId('tag'), createdAt: new Date().toISOString() }
  save(KEYS.tags, [...load<LocalTag>(KEYS.tags), item])
  return item
}

export function deleteTag(id: number): void {
  save(KEYS.tags, load<LocalTag>(KEYS.tags).filter(t => t.id !== id))
  // Unlink from events
  const events = load<LocalEvent>(KEYS.events).map(e => ({
    ...e, tagIds: e.tagIds.filter(tid => tid !== id)
  }))
  save(KEYS.events, events)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function listEvents(startDate?: string, endDate?: string): LocalEvent[] {
  let all = load<LocalEvent>(KEYS.events)
  if (startDate) all = all.filter(e => new Date(e.endDate) >= new Date(startDate))
  if (endDate)   all = all.filter(e => new Date(e.startDate) <= new Date(endDate))

  // Enrich with joined category + tags so views can use event.category / event.tags
  const cats = load<LocalCategory>(KEYS.categories)
  const tags = load<LocalTag>(KEYS.tags)
  const catMap = new Map(cats.map(c => [c.id, c]))
  const tagMap = new Map(tags.map(t => [t.id, t]))

  return all.map(e => {
    const cat = e.categoryId != null ? catMap.get(e.categoryId) ?? null : null
    return {
      ...e,
      color:    cat?.color ?? undefined,
      category: cat ? { id: cat.id, name: cat.name, color: cat.color } : undefined,
      tags:     (e.tagIds ?? []).map(id => tagMap.get(id)).filter(Boolean) as LocalTag[],
    }
  })
}

export interface CreateEventInput {
  title: string
  startDate: string
  endDate: string
  allDay?: boolean
  description?: string | null
  location?: string | null
  categoryId?: number | null
  tagIds?: number[]
  reminderMinutes?: number[]
}

export function createEvent(data: CreateEventInput): LocalEvent {
  const now = new Date().toISOString()
  const event: LocalEvent = {
    id:          nextId('event'),
    title:       data.title,
    startDate:   data.startDate,
    endDate:     data.endDate,
    allDay:      data.allDay ?? false,
    description: data.description ?? null,
    location:    data.location ?? null,
    categoryId:  data.categoryId ?? null,
    tagIds:      data.tagIds ?? [],
    createdAt:   now,
    updatedAt:   now,
  }
  save(KEYS.events, [...load<LocalEvent>(KEYS.events), event])

  // Create reminders
  if (data.reminderMinutes?.length) {
    const reminders = load<LocalReminder>(KEYS.reminders)
    const newReminders = data.reminderMinutes.map(m => ({
      id: nextId('reminder'), eventId: event.id, minutesBefore: m, createdAt: now
    }))
    save(KEYS.reminders, [...reminders, ...newReminders])
  }

  return event
}

export function updateEvent(id: number, data: Partial<CreateEventInput>): LocalEvent {
  const now = new Date().toISOString()
  const all = load<LocalEvent>(KEYS.events).map(e =>
    e.id === id ? { ...e, ...data, tagIds: data.tagIds ?? e.tagIds, updatedAt: now } : e
  )
  save(KEYS.events, all)

  // Replace reminders if provided
  if (data.reminderMinutes !== undefined) {
    const others = load<LocalReminder>(KEYS.reminders).filter(r => r.eventId !== id)
    const fresh = data.reminderMinutes.map(m => ({
      id: nextId('reminder'), eventId: id, minutesBefore: m, createdAt: now
    }))
    save(KEYS.reminders, [...others, ...fresh])
  }

  return all.find(e => e.id === id)!
}

export function deleteEvent(id: number): void {
  save(KEYS.events, load<LocalEvent>(KEYS.events).filter(e => e.id !== id))
  save(KEYS.reminders, load<LocalReminder>(KEYS.reminders).filter(r => r.eventId !== id))
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function listReminders(eventId: number): LocalReminder[] {
  return load<LocalReminder>(KEYS.reminders).filter(r => r.eventId === eventId)
}
