import { useCalendar } from "@/context/calendar-context"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getHeaderTitle } from "@/lib/date-utils"
import { useState } from "react"
import { EventModal } from "./event-modal"

const VIEWS = ["day", "week", "month", "year", "schedule"] as const

export function Header() {
  const { view, setView, currentDate, navigatePrev, navigateNext, navigateToday } = useCalendar()
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full shrink-0 border-b glass-panel backdrop-blur-[20px]">
        {/* Row 1: nav + title + new event */}
        <div className="flex h-12 items-center gap-2 px-3 sm:px-6">

          {/* Nav arrows + Today */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={navigatePrev}
              aria-label="Previous"
              className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={navigateNext}
              aria-label="Next"
              className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToday}
              className="h-7 rounded-full border-muted-foreground/20 font-medium bg-background/50 hover:bg-background shadow-sm text-xs px-3 ml-1"
            >
              Today
            </Button>
          </div>

          {/* Title */}
          <h2 className="flex-1 min-w-0 truncate text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {getHeaderTitle(currentDate, view)}
          </h2>

          {/* View switcher — desktop only (hidden on mobile, shown in row 2) */}
          <div className="hidden sm:flex rounded-full bg-muted/50 p-0.5 backdrop-blur-md border border-border/50 shrink-0">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
                  view === v
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* New Event */}
          <Button
            onClick={() => setIsEventModalOpen(true)}
            size="sm"
            className="rounded-full shadow-md hover:shadow-lg transition-all shrink-0 h-8 px-3 text-xs sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
        </div>

        {/* Row 2: view switcher — mobile only */}
        <div className="sm:hidden flex items-center justify-center px-3 pb-2">
          <div className="flex w-full rounded-full bg-muted/50 p-0.5 backdrop-blur-md border border-border/50">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
                  view === v
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
        />
      )}
    </>
  )
}
