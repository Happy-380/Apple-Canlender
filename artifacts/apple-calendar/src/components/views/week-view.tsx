import { useCalendar } from "@/context/calendar-context"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import type { Event } from "@/lib/local-hooks"
import { format, startOfDay, endOfDay, eachHourOfInterval, isSameDay, startOfWeek, eachDayOfInterval, addDays, addMinutes } from "date-fns"
import { useState, useRef, useEffect } from "react"
import { EventModal } from "../event-modal"
import { cn } from "@/lib/utils"

export function WeekView() {
  const { currentDate } = useCalendar()
  const { events } = useCalendarEvents()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined)
  const [initialEndDate, setInitialEndDate] = useState<Date | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Drag to create
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartCol, setDragStartCol] = useState<number | null>(null)
  const [dragStartMins, setDragStartMins] = useState<number | null>(null)
  const [dragCurrentMins, setDragCurrentMins] = useState<number | null>(null)
  
  const weekStart = startOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  
  const hours = eachHourOfInterval({
    start: startOfDay(currentDate),
    end: endOfDay(currentDate)
  })

  // Scroll to current time
  useEffect(() => {
    const now = new Date()
    if (now >= weekStart && now <= addDays(weekStart, 7) && containerRef.current) {
      const scrollY = (now.getHours() * 60 + now.getMinutes()) * (60/60) - 200
      containerRef.current.scrollTo({ top: Math.max(0, scrollY), behavior: 'smooth' })
    }
  }, [currentDate])

  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const getMinutesFromY = (e: React.MouseEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const y = e.clientY - rect.top
    return Math.max(0, Math.min(24 * 60, y))
  }

  const handleMouseDown = (e: React.MouseEvent, colIndex: number) => {
    if (e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    const mins = Math.floor(getMinutesFromY(e, el) / 15) * 15
    setIsDragging(true)
    setDragStartCol(colIndex)
    setDragStartMins(mins)
    setDragCurrentMins(mins + 30)
  }

  const handleMouseMove = (e: React.MouseEvent, colIndex: number) => {
    if (!isDragging || dragStartCol !== colIndex || dragStartMins === null) return
    const el = e.currentTarget as HTMLElement
    const mins = Math.floor(getMinutesFromY(e, el) / 15) * 15
    setDragCurrentMins(mins)
  }

  const handleMouseUp = () => {
    if (!isDragging || dragStartCol === null || dragStartMins === null || dragCurrentMins === null) return
    
    let startMins = Math.min(dragStartMins, dragCurrentMins)
    let endMins = Math.max(dragStartMins, dragCurrentMins)
    
    if (startMins === endMins) endMins = startMins + 60

    const day = days[dragStartCol]
    const start = startOfDay(day)
    
    setInitialDate(addMinutes(start, startMins))
    setInitialEndDate(addMinutes(start, endMins))
    setSelectedEvent(null)
    setIsDragging(false)
    setDragStartCol(null)
    setDragStartMins(null)
    setDragCurrentMins(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-background" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Week Header */}
      <div className="flex border-b border-border/50 glass-bar z-20 sticky top-0">
        <div className="w-14 shrink-0 border-r border-border/50" />
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={i} className="text-center py-2 border-r border-border/50 last:border-r-0 flex flex-col items-center justify-center">
                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", isToday ? "text-primary" : "text-muted-foreground")}>
                  {format(day, "EEE")}
                </span>
                <span className={cn("text-xl mt-0.5 w-8 h-8 flex items-center justify-center rounded-full transition-colors", isToday ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-foreground hover:bg-muted")}>
                  {format(day, "d")}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All-day section */}
      <div className="flex border-b pl-14 bg-muted/10 min-h-[32px]">
         <div className="flex-1 grid grid-cols-7">
           {days.map((day, i) => {
             const dayEvents = events.filter(e => e.allDay && (isSameDay(new Date(e.startDate), day) || (new Date(e.startDate) <= day && new Date(e.endDate) >= day)))
             return (
               <div key={i} className="border-r border-border/50 last:border-r-0 p-1 flex flex-col gap-1 min-h-[32px]">
                 {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="px-1.5 py-0.5 text-[10px] font-medium rounded truncate cursor-pointer hover:brightness-95 transition-all shadow-sm"
                      style={{ 
                        backgroundColor: `${event.color || event.category?.color || '#3b82f6'}20`,
                        color: event.color || event.category?.color || '#3b82f6',
                        borderLeft: `2px solid ${event.color || event.category?.color || '#3b82f6'}`
                      }}
                    >
                      {event.title}
                    </div>
                 ))}
               </div>
             )
           })}
         </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="flex min-h-[1440px]">
          {/* Time axis */}
          <div className="w-14 shrink-0 border-r border-border/50 sticky left-0 bg-background/95 backdrop-blur z-10">
            {hours.map((hour, i) => (
              <div key={i} className="h-[60px] relative">
                <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground font-medium">
                  {format(hour, "h aa")}
                </span>
              </div>
            ))}
          </div>

          {/* 7 Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {/* Grid lines background */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {hours.map((_, i) => (
                <div key={i} className="h-[60px] border-b border-border/40 w-full shrink-0" />
              ))}
            </div>

            {/* Columns content */}
            {days.map((day, colIndex) => {
              const dayEvents = events.filter(e => 
                !e.allDay && (isSameDay(new Date(e.startDate), day) || (new Date(e.startDate) <= day && new Date(e.endDate) >= day))
              )

              return (
                <div 
                  key={colIndex} 
                  className="relative border-r border-border/50 last:border-r-0 cursor-crosshair group" 
                  style={{ height: `${24 * 60}px` }}
                  onMouseDown={(e) => handleMouseDown(e, colIndex)}
                  onMouseMove={(e) => handleMouseMove(e, colIndex)}
                >
                  {/* Drag Preview */}
                  {isDragging && dragStartCol === colIndex && dragStartMins !== null && dragCurrentMins !== null && (
                    <div
                      className="absolute left-0.5 right-1 rounded bg-primary/20 border border-primary/50 pointer-events-none z-30"
                      style={{
                        top: `${Math.min(dragStartMins, dragCurrentMins)}px`,
                        height: `${Math.max(15, Math.abs(dragCurrentMins - dragStartMins))}px`
                      }}
                    >
                      <div className="text-[10px] font-medium text-primary px-1 truncate py-0.5">
                        New Event
                      </div>
                    </div>
                  )}

                  {/* Render Timed Events */}
                  {dayEvents.map(event => {
                    const start = new Date(event.startDate)
                    const end = new Date(event.endDate)
                    
                    const startMinutes = isSameDay(start, day) ? start.getHours() * 60 + start.getMinutes() : 0
                    const endMinutes = isSameDay(end, day) ? end.getHours() * 60 + end.getMinutes() : 24 * 60
                    
                    const top = startMinutes
                    const height = Math.max(15, (endMinutes - startMinutes))
                    const color = event.color || event.category?.color || '#3b82f6'

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(e, event)}
                        className="absolute left-0.5 right-1 rounded px-1.5 py-0.5 overflow-hidden shadow-sm hover:shadow-md cursor-pointer border border-white/10 z-10 hover:z-20 transition-all"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: `${color}25`,
                          borderLeft: `3px solid ${color}`,
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <div className="text-[10px] font-semibold leading-tight truncate hover:underline" style={{ color: color }}>{event.title}</div>
                      </div>
                    )
                  })}

                  {/* Current Time Line */}
                  {isSameDay(day, new Date()) && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-destructive z-20 pointer-events-none flex items-center"
                      style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes())}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1.5 shadow-sm" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EventModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false)
            setInitialDate(undefined)
            setInitialEndDate(undefined)
          }}
          event={selectedEvent || undefined}
          initialDate={initialDate}
          initialEndDate={initialEndDate}
        />
      )}
    </div>
  )
}
