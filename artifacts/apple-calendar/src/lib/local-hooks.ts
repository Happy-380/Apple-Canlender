/**
 * React Query hooks backed by localStorage.
 * Drop-in replacements for @workspace/api-client-react hooks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as store from './local-store'

// Re-export types so components can import from one place
export type { LocalCategory as Category, LocalTag as Tag, LocalEvent as Event, LocalReminder as Reminder } from './local-store'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const CATEGORY_KEY = ['categories'] as const
export const TAG_KEY      = ['tags'] as const
export const EVENT_KEY    = ['events'] as const

export function getListCategoriesQueryKey() { return CATEGORY_KEY }
export function getListTagsQueryKey()       { return TAG_KEY }
export function getListEventsQueryKey()     { return EVENT_KEY }

// ─── Categories ───────────────────────────────────────────────────────────────

export function useListCategories(_opts?: unknown) {
  return useQuery({ queryKey: CATEGORY_KEY, queryFn: store.listCategories, staleTime: Infinity })
}

export function useCreateCategory(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { data: { name: string; color: string } }) => {
      return Promise.resolve(store.createCategory(arg.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORY_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

export function useUpdateCategory(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: number; data: Partial<{ name: string; color: string }> }) => {
      return Promise.resolve(store.updateCategory(arg.id, arg.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORY_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

export function useDeleteCategory(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: number }) => {
      store.deleteCategory(arg.id)
      return Promise.resolve()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CATEGORY_KEY })
      qc.invalidateQueries({ queryKey: EVENT_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export function useListTags(_opts?: unknown) {
  return useQuery({ queryKey: TAG_KEY, queryFn: store.listTags, staleTime: Infinity })
}

export function useCreateTag(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { data: { name: string; color: string } }) => {
      return Promise.resolve(store.createTag(arg.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

export function useDeleteTag(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: number }) => {
      store.deleteTag(arg.id)
      return Promise.resolve()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_KEY })
      qc.invalidateQueries({ queryKey: EVENT_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function useListEvents(
  params: { startDate?: string; endDate?: string },
  opts?: { query?: { queryKey?: readonly unknown[]; enabled?: boolean } },
) {
  const key = opts?.query?.queryKey ?? [...EVENT_KEY, params.startDate, params.endDate]
  return useQuery({
    queryKey: key,
    queryFn: () => store.listEvents(params.startDate, params.endDate),
    enabled:  opts?.query?.enabled !== false,
    staleTime: 0,
  })
}

export function useCreateEvent(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { data: store.CreateEventInput }) => {
      return Promise.resolve(store.createEvent(arg.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

export function useUpdateEvent(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: number; data: Partial<store.CreateEventInput> }) => {
      return Promise.resolve(store.updateEvent(arg.id, arg.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

export function useDeleteEvent(opts?: { mutation?: { onSuccess?: () => void } }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (arg: { id: number }) => {
      store.deleteEvent(arg.id)
      return Promise.resolve()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEY })
      opts?.mutation?.onSuccess?.()
    },
  })
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useListEventReminders(
  eventId: number,
  opts?: { query?: { enabled?: boolean; queryKey?: readonly unknown[] } },
) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? ['reminders', eventId],
    queryFn:  () => store.listReminders(eventId),
    enabled:  opts?.query?.enabled !== false,
    staleTime: Infinity,
  })
}
