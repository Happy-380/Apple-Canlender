import { useCalendar } from "@/context/calendar-context"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  useListCategories, useListTags, useListEvents,
  useCreateCategory, useCreateTag,
  useUpdateCategory, useDeleteCategory, useDeleteTag,
  getListCategoriesQueryKey, getListTagsQueryKey,
} from "@/lib/local-hooks"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  format, addMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth,
} from "date-fns"
import { cn } from "@/lib/utils"

const COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#30b0c7',
  '#32ade6', '#007aff', '#5856d6', '#af52de', '#ff2d55', '#a2845e',
]

// ─── Custom mini-calendar ─────────────────────────────────────────────────────
function MiniCalendar() {
  const { currentDate, setCurrentDate, view, setView } = useCalendar()
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(currentDate))

  // Keep displayMonth in sync when the main date jumps (e.g. "Today" button)
  useEffect(() => {
    setDisplayMonth(startOfMonth(currentDate))
  }, [currentDate.getFullYear(), currentDate.getMonth()])

  const monthStart = startOfMonth(displayMonth)
  const monthEnd   = endOfMonth(displayMonth)

  // Fetch events for this month so we can show dots
  const { data: monthEvents = [] } = useListEvents(
    { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() },
    { query: { queryKey: ["mini-events", format(displayMonth, "yyyy-MM")] } },
  )

  const daysWithEvents = new Set(
    monthEvents.map(e => format(new Date(e.startDate), "yyyy-MM-dd")),
  )

  const gridStart = startOfWeek(monthStart)
  const gridEnd   = endOfWeek(monthEnd)
  const allDays   = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Group into rows of 7
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

  const today = new Date()

  return (
    <div className="select-none px-1">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setDisplayMonth(m => addMonths(m, -1))}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-foreground">
          {format(displayMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setDisplayMonth(m => addMonths(m, 1))}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fixed-width table — each column is exactly 32px */}
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <th key={d} className="w-8 text-center text-[10px] font-medium text-muted-foreground pb-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const key       = format(day, "yyyy-MM-dd")
                const isToday   = isSameDay(day, today)
                const isSelected = isSameDay(day, currentDate)
                const inMonth   = isSameMonth(day, displayMonth)
                const hasDot    = daysWithEvents.has(key) && !isSelected

                return (
                  <td key={di} className="w-8 p-0 text-center">
                    <button
                      onClick={() => {
                        setCurrentDate(day)
                        if (view === "year" || view === "schedule") setView("day")
                        else setDisplayMonth(startOfMonth(day))
                      }}
                      className={cn(
                        "relative mx-auto flex flex-col items-center justify-center w-7 h-7 rounded-full text-[11px] font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isToday
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted",
                        !inMonth && "opacity-30",
                      )}
                    >
                      {format(day, "d")}
                      {hasDot && (
                        <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-primary" />
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { hiddenCategories, toggleCategory, selectedTag, setTag } = useCalendar()
  const queryClient = useQueryClient()

  const { data: categories = [] } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } })
  const { data: tags = [] }       = useListTags({ query: { queryKey: getListTagsQueryKey() } })

  const createCategory = useCreateCategory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }) } })
  const updateCategory = useUpdateCategory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }) } })
  const deleteCategory = useDeleteCategory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }) } })
  const createTag      = useCreateTag({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() }) } })
  const deleteTag      = useDeleteTag({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() }) } })

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName]             = useState("")
  const [isAddingTag, setIsAddingTag]           = useState(false)
  const [newTagName, setNewTagName]             = useState("")

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      createCategory.mutate({ data: { name: newCatName, color: COLORS[categories.length % COLORS.length] } })
      setNewCatName("")
      setIsAddingCategory(false)
    }
  }

  const handleAddTag = () => {
    if (newTagName.trim()) {
      createTag.mutate({ data: { name: newTagName, color: COLORS[(tags.length + 5) % COLORS.length] } })
      setNewTagName("")
      setIsAddingTag(false)
    }
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-background/50 h-full overflow-y-auto custom-scrollbar">
      {/* Mini calendar */}
      <div className="p-3 border-b">
        <MiniCalendar />
      </div>

      <div className="flex-1 py-5 px-3 space-y-7">
        {/* My Calendars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Calendars
            </h3>
            <Button
              variant="ghost" size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsAddingCategory(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1">
            {categories.map(category => (
              <div key={category.id} className="flex items-center gap-2 group justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={!hiddenCategories.has(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                    className="rounded-full w-4 h-4 border-2 transition-colors data-[state=checked]:bg-transparent shrink-0"
                    style={{
                      borderColor: category.color,
                      backgroundColor: !hiddenCategories.has(category.id) ? category.color : 'transparent',
                    }}
                  />
                  <label
                    htmlFor={`cat-${category.id}`}
                    className="text-sm font-medium cursor-pointer truncate flex-1 leading-none"
                  >
                    {category.name}
                  </label>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0 shrink-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-3" align="start">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <Input
                          defaultValue={category.name}
                          onBlur={e => {
                            if (e.target.value !== category.name)
                              updateCategory.mutate({ id: category.id, data: { name: e.target.value } })
                          }}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Color</label>
                        <div className="flex flex-wrap gap-1.5">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              className={`w-5 h-5 rounded-full border-2 ${category.color === color ? 'border-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                              onClick={() => updateCategory.mutate({ id: category.id, data: { color } })}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/50">
                        <Button
                          variant="ghost" size="sm"
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                          onClick={() => deleteCategory.mutate({ id: category.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete Calendar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}

            {isAddingCategory && (
              <Input
                autoFocus size={1}
                className="h-7 text-xs bg-background mt-1"
                placeholder="New Calendar"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory()
                  if (e.key === 'Escape') setIsAddingCategory(false)
                }}
                onBlur={() => { if (newCatName) handleAddCategory(); else setIsAddingCategory(false) }}
              />
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between group">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</h3>
            <Button
              variant="ghost" size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsAddingTag(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Popover key={tag.id}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setTag(selectedTag === tag.id ? null : tag.id)}
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors border",
                      selectedTag === tag.id
                        ? "text-white border-transparent"
                        : "bg-background hover:bg-muted border-border",
                    )}
                    style={selectedTag === tag.id ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedTag === tag.id ? '#fff' : tag.color }}
                      />
                      {tag.name}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-1.5" align="start">
                  <Button
                    variant="ghost" size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                    onClick={() => deleteTag.mutate({ id: tag.id })}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Tag
                  </Button>
                </PopoverContent>
              </Popover>
            ))}
          </div>

          {isAddingTag && (
            <Input
              autoFocus size={1}
              className="h-7 text-xs bg-background w-full rounded-full px-3 mt-1"
              placeholder="New Tag"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') setIsAddingTag(false)
              }}
              onBlur={() => { if (newTagName) handleAddTag(); else setIsAddingTag(false) }}
            />
          )}
        </div>
      </div>
    </aside>
  )
}
