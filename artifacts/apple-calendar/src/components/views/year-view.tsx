import { useCalendar } from "@/context/calendar-context"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import { format, startOfYear, eachMonthOfInterval, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"

export function YearView() {
  const { currentDate, setView, setCurrentDate } = useCalendar()
  const { events } = useCalendarEvents()

  const yearStart = startOfYear(currentDate)
  const months = eachMonthOfInterval({ start: yearStart, end: addMonths(yearStart, 11) })

  const handleMonthClick = (month: Date) => {
    setCurrentDate(month)
    setView("month")
  }

  return (
    <div className="h-full bg-background overflow-y-auto p-8 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 max-w-7xl mx-auto">
        {months.map((month, i) => {
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
          const startDate = startOfWeek(monthStart)
          const endDate = endOfWeek(monthEnd)
          const days = eachDayOfInterval({ start: startDate, end: endDate })

          return (
            <div key={i} className="flex flex-col">
              <h3 
                className="text-lg font-semibold text-primary cursor-pointer hover:underline mb-4"
                onClick={() => handleMonthClick(month)}
              >
                {format(month, "MMMM")}
              </h3>
              
              <div className="grid grid-cols-7 gap-y-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, j) => (
                  <div key={`h-${j}`} className="text-center text-[10px] font-semibold text-muted-foreground">
                    {d}
                  </div>
                ))}
                
                {days.map((day, j) => {
                  const isCurrentMonth = isSameMonth(day, month)
                  const isToday = isSameDay(day, new Date())
                  
                  // Simple check if event exists on this day
                  const hasEvents = events.some(e => 
                    isSameDay(new Date(e.startDate), day) || 
                    (new Date(e.startDate) <= day && new Date(e.endDate) >= day)
                  )

                  return (
                    <div 
                      key={`d-${j}`} 
                      className="flex flex-col items-center justify-start h-8 relative cursor-pointer group"
                      onClick={() => {
                        setCurrentDate(day)
                        setView("day")
                      }}
                    >
                      <span className={cn(
                        "text-[13px] w-6 h-6 flex items-center justify-center rounded-full transition-colors group-hover:bg-muted",
                        isToday ? "bg-primary text-primary-foreground group-hover:bg-primary/90 font-bold" : 
                        !isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"
                      )}>
                        {format(day, "d")}
                      </span>
                      {hasEvents && isCurrentMonth && (
                        <div className="w-1 h-1 rounded-full bg-muted-foreground mt-0.5" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
