import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { DayView } from "@/components/views/day-view"
import { WeekView } from "@/components/views/week-view"
import { MonthView } from "@/components/views/month-view"
import { YearView } from "@/components/views/year-view"
import { ScheduleView } from "@/components/views/schedule-view"
import { useCalendar } from "@/context/calendar-context"

export function CalendarApp() {
  const { view } = useCalendar()

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative z-0">
          {view === "day" && <DayView />}
          {view === "week" && <WeekView />}
          {view === "month" && <MonthView />}
          {view === "year" && <YearView />}
          {view === "schedule" && <ScheduleView />}
        </main>
      </div>
    </div>
  )
}
