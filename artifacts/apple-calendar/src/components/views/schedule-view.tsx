import { useCalendarEvents } from "@/hooks/use-calendar-events"
import type { Event } from "@/lib/local-hooks"
import { format, isSameDay, startOfDay } from "date-fns"
import { useState, useMemo, useRef, useEffect } from "react"
import { EventModal } from "../event-modal"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ScheduleView() {
  const { events } = useCalendarEvents()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const todayRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Group ALL events by date (past + future), sorted chronologically
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    const groups: { date: Date; events: Event[] }[] = []
    sorted.forEach(event => {
      const date = startOfDay(new Date(event.startDate))
      const existing = groups.find(g => isSameDay(g.date, date))
      if (existing) {
        existing.events.push(event)
      } else {
        groups.push({ date, events: [event] })
      }
    })
    return groups
  }, [events])

  // Scroll to today's group once events have loaded
  useEffect(() => {
    if (!todayRef.current) return
    // Small delay so the DOM has fully rendered
    const id = setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
    return () => clearTimeout(id)
  }, [groupedEvents.length])

  function handleEventClick(e: React.MouseEvent, event: Event) {
    e.stopPropagation()
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <ScrollArea className="flex-1 px-4 sm:px-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-10 pb-10">
          {groupedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <h3 className="text-lg font-medium text-foreground">No events yet</h3>
              <p className="text-sm mt-1">Tap + to create your first event.</p>
            </div>
          ) : (
            groupedEvents.map((group, i) => {
              const isToday = isSameDay(group.date, new Date())
              const isPast  = group.date < startOfDay(new Date())
              return (
                <div
                  key={i}
                  ref={isToday ? todayRef : undefined}
                  className="animate-in slide-in-from-bottom-4 fade-in duration-500"
                  style={{ animationFillMode: "both", animationDelay: `${i * 60}ms` }}
                >
                  {/* Day header */}
                  <div className="sticky top-0 z-10 glass-bar border-b border-border/50 py-2 mb-4">
                    <h3 className={`text-lg font-semibold flex items-baseline gap-2 ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                      {format(group.date, "EEEE, MMMM d")}
                      {isToday && (
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Events for this day */}
                  <div className={`rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/40 ${isPast ? "opacity-60" : ""}`}>
                    {group.events.map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(e, event)}
                        className="flex items-start gap-4 px-4 py-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        {/* Color dot */}
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: event.color || event.category?.color || "#3b82f6" }}
                        />

                        {/* Time */}
                        <div className="w-20 shrink-0">
                          {event.allDay ? (
                            <span className="text-sm text-muted-foreground">All day</span>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground">{format(new Date(event.startDate), "h:mm a")}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(event.endDate), "h:mm a")}</p>
                            </>
                          )}
                        </div>

                        {/* Title + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{event.location}</p>
                          )}
                          {(event.category || (event.tags?.length ?? 0) > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {event.category && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: event.category.color }} />
                                  {event.category.name}
                                </span>
                              )}
                              {event.tags?.map(tag => (
                                <span key={tag.id} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                                  style={{ borderColor: `${tag.color}50`, color: tag.color }}>
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {isModalOpen && selectedEvent && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedEvent(null) }}
          event={selectedEvent}
        />
      )}
    </div>
  )
}
