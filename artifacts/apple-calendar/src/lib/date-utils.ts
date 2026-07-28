import { format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addDays, subDays, addYears, subYears } from "date-fns"

export type ViewType = "day" | "week" | "month" | "year" | "schedule"

export function getHeaderTitle(date: Date, view: ViewType) {
  if (view === "day") return format(date, "MMMM d, yyyy")
  if (view === "week") {
    const start = startOfWeek(date)
    const end = endOfWeek(date)
    if (start.getMonth() === end.getMonth()) {
      return format(start, "MMMM yyyy")
    }
    return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`
  }
  if (view === "month") return format(date, "MMMM yyyy")
  if (view === "year") return format(date, "yyyy")
  return "Schedule"
}

export function navigateDate(date: Date, view: ViewType, direction: "prev" | "next" | "today") {
  if (direction === "today") return new Date()
  
  const sign = direction === "next" ? 1 : -1
  
  switch(view) {
    case "day": return addDays(date, 1 * sign)
    case "week": return addWeeks(date, 1 * sign)
    case "month": return addMonths(date, 1 * sign)
    case "year": return addYears(date, 1 * sign)
    case "schedule": return addMonths(date, 1 * sign) // Default scroll for schedule
    default: return date
  }
}

export function getViewDateRange(date: Date, view: ViewType) {
  if (view === "day") return { start: date, end: date }
  if (view === "week") return { start: startOfWeek(date), end: endOfWeek(date) }
  if (view === "month") return { start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date)) }
  if (view === "year") return { start: startOfMonth(addMonths(date, -date.getMonth())), end: endOfMonth(addMonths(date, 11 - date.getMonth())) }
  return { start: new Date(), end: addYears(new Date(), 1) } // Schedule is forward looking
}
