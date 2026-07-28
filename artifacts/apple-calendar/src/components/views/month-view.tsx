import { useCalendar } from "@/context/calendar-context"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import type { Event } from "@/lib/local-hooks"
import { format, isSameMonth, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addHours } from "date-fns"
import { useState } from "react"
import { EventModal } from "../event-modal"
import { cn } from "@/lib/utils"

export function MonthView() {
  const { currentDate } = useCalendar()
  const { events } = useCalendarEvents()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined)
  const [initialEndDate, setInitialEndDate] = useState<Date | undefined>(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDayClick = (day: Date) => {
    setSelectedEvent(null)
    const newDate = new Date(day)
    newDate.setHours(9) // default to 9 AM
    setInitialDate(newDate)
    setInitialEndDate(addHours(newDate, 1))
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-border/50 glass-bar z-10 shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
        {days.map((day, i) => {
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentDate)
          
          const dayEvents = events.filter(e => 
            isSameDay(new Date(e.startDate), day) || 
            (new Date(e.startDate) <= day && new Date(e.endDate) >= day)
          )

          // Sort: all day first, then by time
          dayEvents.sort((a, b) => {
            if (a.allDay && !b.allDay) return -1
            if (!a.allDay && b.allDay) return 1
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          })

          const displayEvents = dayEvents.slice(0, 3)
          const hiddenCount = Math.max(0, dayEvents.length - 3)

          return (
            <div 
              key={i}
              onClick={() => handleDayClick(day)}
              className={cn(
                "border-r border-b border-border/50 p-1 flex flex-col transition-colors hover:bg-muted/10 cursor-pointer overflow-hidden group",
                !isCurrentMonth && "bg-muted/5",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-end mb-1">
                <span className={cn(
                  "text-[13px] font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                  isToday ? "bg-primary text-primary-foreground font-bold shadow-sm" : 
                  !isCurrentMonth ? "text-muted-foreground/50" : "text-foreground group-hover:bg-muted"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {displayEvents.map(event => {
                  const color = event.color || event.category?.color || '#3b82f6'
                  const isAllDay = event.allDay
                  
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] truncate rounded transition-opacity hover:opacity-80 cursor-pointer",
                        isAllDay ? "font-medium shadow-sm" : "font-medium bg-transparent px-1"
                      )}
                      style={isAllDay ? {
                        backgroundColor: `${color}20`,
                        color: color,
                        borderLeft: `2px solid ${color}`
                      } : {
                        color: 'inherit'
                      }}
                    >
                      {!isAllDay && (
                        <span className="w-1.5 h-1.5 rounded-full inline-block mr-1 shadow-sm" style={{ backgroundColor: color }} />
                      )}
                      {!isAllDay && <span className="mr-1 text-muted-foreground opacity-80 font-normal">{format(new Date(event.startDate), 'h:mm')}</span>}
                      {event.title}
                    </div>
                  )
                })}
                {hiddenCount > 0 && (
                  <div className="text-[10px] text-muted-foreground font-medium px-1 mt-auto pb-0.5">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <EventModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent || undefined}
          initialDate={initialDate}
          initialEndDate={initialEndDate}
        />
      )}
    </div>
  )
}
