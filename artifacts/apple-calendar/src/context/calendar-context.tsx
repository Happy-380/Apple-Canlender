import { createContext, useContext, ReactNode, useState, useMemo } from "react"
import { startOfMonth, startOfWeek, endOfMonth, endOfWeek, subMonths, addMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns"
import { ViewType, navigateDate, getViewDateRange } from "@/lib/date-utils"

interface CalendarState {
  view: ViewType
  currentDate: Date
  selectedDate: Date
  hiddenCategories: Set<number>
  selectedTag: number | null
}

interface CalendarActions {
  setView: (view: ViewType) => void
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date) => void
  navigatePrev: () => void
  navigateNext: () => void
  navigateToday: () => void
  toggleCategory: (id: number) => void
  setTag: (id: number | null) => void
}

type CalendarContextType = CalendarState & CalendarActions & {
  viewRange: { start: Date, end: Date }
}

const CalendarContext = createContext<CalendarContextType | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [hiddenCategories, setHiddenCategories] = useState<Set<number>>(new Set())
  const [selectedTag, setSelectedTag] = useState<number | null>(null)

  const viewRange = useMemo(() => getViewDateRange(currentDate, view), [currentDate, view])

  const navigatePrev = () => setCurrentDate(d => navigateDate(d, view, "prev"))
  const navigateNext = () => setCurrentDate(d => navigateDate(d, view, "next"))
  const navigateToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const toggleCategory = (id: number) => {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const value = {
    view, setView,
    currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    hiddenCategories, toggleCategory,
    selectedTag, setTag: setSelectedTag,
    navigatePrev, navigateNext, navigateToday,
    viewRange
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider")
  return ctx
}
