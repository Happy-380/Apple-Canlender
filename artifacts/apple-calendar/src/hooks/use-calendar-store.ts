import { useState } from "react"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, format, isSameDay } from "date-fns"

type View = "day" | "week" | "month" | "year" | "schedule"

export function useCalendarStore() {
  const [view, setView] = useState<View>("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [hiddenCategories, setHiddenCategories] = useState<Set<number>>(new Set())
  const [selectedTag, setSelectedTag] = useState<number | null>(null)

  const toggleCategory = (id: number) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const navigatePrev = () => {
    if (view === "month" || view === "year") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subMonths(currentDate, 0)) // We can do addWeeks(-1)
    // Add logic for day/week/year
  }

  return {
    view, setView,
    currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    hiddenCategories, toggleCategory,
    selectedTag, setSelectedTag,
  }
}
