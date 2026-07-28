import { useCalendar } from "@/context/calendar-context"
import { useCalendarEvents } from "@/hooks/use-calendar-events"
import type { Event } from "@/lib/local-hooks"
import { format, startOfDay, endOfDay, eachHourOfInterval, isSameDay, addMinutes, differenceInMinutes } from "date-fns"
import { useState, useRef, useEffect } from "react"
import { EventModal } from "../event-modal"
import { cn } from "@/lib/utils"

export function DayView() {
  const { currentDate } = useCalendar()
  const { events } = useCalendarEvents()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined)
  const [initialEndDate, setInitialEndDate] = useState<Date | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Drag to create state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartMins, setDragStartMins] = useState<number | null>(null)
  const [dragCurrentMins, setDragCurrentMins] = useState<number | null>(null)

  // Scroll to current time on mount if today
  useEffect(() => {
    if (isSameDay(currentDate, new Date()) && containerRef.current) {
      const now = new Date()
      const scrollY = (now.getHours() * 60 + now.getMinutes()) * (60/60) - 200 // 60px per hour
      containerRef.current.scrollTo({ top: Math.max(0, scrollY), behavior: 'smooth' })
    }
  }, [currentDate])

  const hours = eachHourOfInterval({
    start: startOfDay(currentDate),
    end: endOfDay(currentDate)
  })

  const dayEvents = events.filter(e => 
    isSameDay(new Date(e.startDate), currentDate) || 
    (new Date(e.startDate) <= currentDate && new Date(e.endDate) >= currentDate)
  )

  const allDayEvents = dayEvents.filter(e => e.allDay)
  const timedEvents = dayEvents.filter(e => !e.allDay)

  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const getMinutesFromY = (clientY: number) => {
    if (!gridRef.current) return 0
    const rect = gridRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    return Math.max(0, Math.min(24 * 60, y)) // 1px = 1min
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only
    const mins = Math.floor(getMinutesFromY(e.clientY) / 15) * 15 // Snap to 15 min
    setIsDragging(true)
    setDragStartMins(mins)
    setDragCurrentMins(mins + 30) // Default 30 min duration
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartMins === null) return
    const mins = Math.floor(getMinutesFromY(e.clientY) / 15) * 15
    setDragCurrentMins(mins)
  }

  const handleMouseUp = () => {
    if (!isDragging || dragStartMins === null || dragCurrentMins === null) return
    
    let startMins = Math.min(dragStartMins, dragCurrentMins)
    let endMins = Math.max(dragStartMins, dragCurrentMins)
    
    if (startMins === endMins) {
      endMins = startMins + 60 // Default 1 hr on single click
    }

    const start = startOfDay(currentDate)
    const newStartDate = addMinutes(start, startMins)
    const newEndDate = addMinutes(start, endMins)
    
    setInitialDate(newStartDate)
    setInitialEndDate(newEndDate)
    setSelectedEvent(null)
    setIsDragging(false)
    setDragStartMins(null)
    setDragCurrentMins(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-background" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* All-day section */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b pl-14 pr-4 py-2 min-h-[40px] bg-muted/20">
          <div className="flex flex-col gap-1 w-full">
            {allDayEvents.map(event => (
              <div 
                key={event.id}
                onClick={(e) => handleEventClick(e, event)}
                className="px-2 py-1 text-xs font-medium rounded-md truncate cursor-pointer hover:brightness-95 transition-all shadow-sm"
                style={{ 
                  backgroundColor: `${event.color || event.category?.color || '#3b82f6'}20`,
                  color: event.color || event.category?.color || '#3b82f6',
                  borderLeft: `3px solid ${event.color || event.category?.color || '#3b82f6'}`
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="flex min-h-[1440px]">
          {/* Time axis */}
          <div className="w-14 shrink-0 border-r border-border/50 sticky left-0 bg-background/95 backdrop-blur z-20">
            {hours.map((hour, i) => (
              <div key={i} className="h-[60px] relative">
                <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground font-medium">
                  {format(hour, "h aa")}
                </span>
              </div>
            ))}
          </div>

          {/* Grid lines & Events */}
          <div 
            ref={gridRef}
            className="flex-1 relative min-w-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {hours.map((_, i) => (
                <div key={i} className="h-[60px] border-b border-border/40 w-full shrink-0" />
              ))}
            </div>

            {/* Drag Preview */}
            {isDragging && dragStartMins !== null && dragCurrentMins !== null && (
              <div
                className="absolute left-1 right-2 rounded-md bg-primary/20 border border-primary/50 pointer-events-none z-30"
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
            {timedEvents.map(event => {
              const start = new Date(event.startDate)
              const end = new Date(event.endDate)
              
              const startMinutes = isSameDay(start, currentDate) ? start.getHours() * 60 + start.getMinutes() : 0
              const endMinutes = isSameDay(end, currentDate) ? end.getHours() * 60 + end.getMinutes() : 24 * 60
              
              const top = startMinutes
              const height = Math.max(20, (endMinutes - startMinutes))
              
              const color = event.color || event.category?.color || '#3b82f6'

              return (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(e, event)}
                  className="absolute left-1 right-2 rounded-md px-2 py-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-white/20 z-10 group"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: `${color}25`,
                    borderLeft: `4px solid ${color}`,
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <div className="text-xs font-semibold leading-tight group-hover:underline" style={{ color: color }}>{event.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight opacity-80 font-medium">
                    {format(start, "h:mm a")} - {format(end, "h:mm a")}
                  </div>
                </div>
              )
            })}

            {/* Current Time Line */}
            {isSameDay(currentDate, new Date()) && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-destructive z-20 pointer-events-none flex items-center"
                style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes())}px` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1.5 shadow-sm" />
              </div>
            )}
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
