import { useState, useMemo } from "react"
import { useCalendar } from "@/context/calendar-context"
import { useListEvents } from "@/lib/local-hooks"
import type { Event } from "@/lib/local-hooks"
import { format } from "date-fns"

export function useCalendarEvents() {
  const { viewRange, hiddenCategories, selectedTag } = useCalendar()
  
  // Format range for API
  const startDate = viewRange.start.toISOString()
  const endDate = viewRange.end.toISOString()

  // Always request events for the visible window
  const { data: allEvents = [], isLoading } = useListEvents(
    { startDate, endDate },
    { query: { queryKey: ["events", startDate, endDate] } } // simplified key for now
  )

  // Filter events client-side based on toggles
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Filter out hidden categories
      if (event.categoryId && hiddenCategories.has(event.categoryId)) {
        return false
      }
      
      // Filter by tag if selected
      if (selectedTag !== null) {
        if (!event.tagIds.includes(selectedTag)) {
          return false
        }
      }
      
      return true
    })
  }, [allEvents, hiddenCategories, selectedTag])

  return {
    events: filteredEvents,
    isLoading
  }
}
