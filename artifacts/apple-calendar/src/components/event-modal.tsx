import { useState, useMemo, useEffect, useRef } from "react"
import type { Event, Category, Tag } from "@/lib/local-hooks"
type ReminderInput = { minutesBefore: number }
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateEvent, useUpdateEvent, useDeleteEvent, useListCategories, useListTags, useListEventReminders } from "@/lib/local-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO, isSameDay } from "date-fns"
import { Bell, Tag as TagIcon, X } from "lucide-react"

export interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  initialEndDate?: Date
  event?: Event
}

const REMINDER_OPTIONS = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
]

export function EventModal({ isOpen, onClose, initialDate, initialEndDate, event }: EventModalProps) {
  const isEditing = !!event
  const queryClient = useQueryClient()
  
  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] })
        onClose()
      }
    }
  })
  
  const updateEvent = useUpdateEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] })
        onClose()
      }
    }
  })

  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["events"] })
        onClose()
      }
    }
  })

  // Format initial times for datetime-local inputs
  const defaultStart = useMemo(() => {
    if (event) return format(parseISO(event.startDate), "yyyy-MM-dd'T'HH:mm")
    if (initialDate) return format(initialDate, "yyyy-MM-dd'T'HH:mm")
    
    // Nearest upcoming hour
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return format(d, "yyyy-MM-dd'T'HH:mm")
  }, [event, initialDate])

  const defaultEnd = useMemo(() => {
    if (event) return format(parseISO(event.endDate), "yyyy-MM-dd'T'HH:mm")
    if (initialEndDate) return format(initialEndDate, "yyyy-MM-dd'T'HH:mm")
    
    const d = new Date(defaultStart)
    d.setHours(d.getHours() + 1)
    return format(d, "yyyy-MM-dd'T'HH:mm")
  }, [event, defaultStart, initialEndDate])

  const [title, setTitle] = useState(event?.title || "")
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [startDateStr, setStartDateStr] = useState(defaultStart)
  const [endDateStr, setEndDateStr] = useState(defaultEnd)
  const [description, setDescription] = useState(event?.description || "")
  const [location, setLocation] = useState(event?.location || "")
  const [categoryId, setCategoryId] = useState<string>(event?.categoryId?.toString() || "")
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(event?.tagIds || [])
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([])

  const { data: categories = [] } = useListCategories()
  const { data: tags = [] } = useListTags()
  const { data: reminders = [] } = useListEventReminders(event?.id || 0, {
    query: { enabled: !!event, queryKey: ["reminders", event?.id] }
  })

  useEffect(() => {
    if (reminders.length > 0 && reminderMinutes.length === 0) {
      setReminderMinutes(reminders.map(r => r.minutesBefore))
    }
  }, [reminders])

  const handleSave = () => {
    if (!title) return
    
    let startIso = new Date(startDateStr).toISOString()
    let endIso = new Date(endDateStr).toISOString()

    if (allDay) {
      const d = new Date(startDateStr)
      d.setHours(0,0,0,0)
      startIso = d.toISOString()
      
      const e = new Date(endDateStr)
      e.setHours(23,59,59,999)
      endIso = e.toISOString()
    }

    const payload = {
      title,
      startDate: startIso,
      endDate: endIso,
      allDay,
      description,
      location,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      tagIds: selectedTagIds,
      reminderMinutes: reminderMinutes.length > 0 ? reminderMinutes : undefined
    }
    
    if (isEditing) {
      updateEvent.mutate({
        id: event.id,
        data: payload
      })
    } else {
      createEvent.mutate({
        data: payload
      })
    }
  }

  const handleDelete = () => {
    if (event) {
      deleteEvent.mutate({ id: event.id })
    }
  }

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const addReminder = (mins: number) => {
    if (!reminderMinutes.includes(mins)) {
      setReminderMinutes([...reminderMinutes, mins])
    }
  }

  const removeReminder = (mins: number) => {
    setReminderMinutes(reminderMinutes.filter(m => m !== mins))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="sr-only">{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Event title"
            className="text-xl font-semibold border-0 border-b border-border/60 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 h-auto py-2 shadow-none rounded-none"
          />
        </DialogHeader>
        <div className="grid gap-5 px-5 py-4 overflow-y-auto flex-1 min-h-0">
          <div className="sr-only" />
          
          <div className="grid gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-sm">All-day</Label>
              <Switch checked={allDay} onCheckedChange={setAllDay} />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm shrink-0 w-12">Starts</Label>
              <Input 
                type={allDay ? "date" : "datetime-local"} 
                value={allDay ? startDateStr.split('T')[0] : startDateStr}
                onChange={e => {
                  const val = e.target.value
                  setStartDateStr(allDay ? `${val}T00:00` : val)
                }}
                className="bg-background/50 h-9" 
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm shrink-0 w-12">Ends</Label>
              <Input 
                type={allDay ? "date" : "datetime-local"} 
                value={allDay ? endDateStr.split('T')[0] : endDateStr}
                onChange={e => {
                  const val = e.target.value
                  setEndDateStr(allDay ? `${val}T23:59` : val)
                }}
                className="bg-background/50 h-9" 
              />
            </div>
          </div>

          <div className="grid gap-3">
            {/* Location */}
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Add Location" 
                className="bg-background/50 border-border/50 h-9 shadow-sm" 
              />
            </div>

            {/* Calendar Category */}
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9 shadow-sm w-full">
                  <SelectValue placeholder="Calendar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Popover */}
            <div className="flex items-start gap-3 mt-1">
              <TagIcon className="text-muted-foreground shrink-0 w-4 h-4 mt-2.5" />
              <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[36px]">
                {tags.filter(t => selectedTagIds.includes(t.id)).map(tag => (
                  <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}>
                    {tag.name}
                    <button type="button" onClick={() => toggleTag(tag.id)} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-full border-dashed">
                      + Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="start">
                    <div className="space-y-1">
                      {tags.map(tag => (
                        <div key={tag.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded-md cursor-pointer" onClick={() => toggleTag(tag.id)}>
                          <Checkbox checked={selectedTagIds.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span className="text-sm font-medium">{tag.name}</span>
                        </div>
                      ))}
                      {tags.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No tags exist.</p>}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Reminders Popover */}
            <div className="flex items-start gap-3 mt-1">
              <Bell className="text-muted-foreground shrink-0 w-4 h-4 mt-2.5" />
              <div className="flex-1 flex flex-col gap-2">
                {reminderMinutes.map(mins => {
                  const opt = REMINDER_OPTIONS.find(o => o.value === mins)
                  return (
                    <div key={mins} className="flex items-center justify-between text-sm bg-background/50 border border-border/50 px-3 py-1.5 rounded-md shadow-sm w-full">
                      <span>{opt?.label || `${mins} minutes before`}</span>
                      <button type="button" onClick={() => removeReminder(mins)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )
                })}
                
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs rounded-full border-dashed mt-1">
                        + Add Alert
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1" align="start">
                      <div className="flex flex-col">
                        {REMINDER_OPTIONS.filter(o => !reminderMinutes.includes(o.value)).map(opt => (
                          <Button key={opt.value} variant="ghost" size="sm" className="justify-start font-normal" onClick={() => addReminder(opt.value)}>
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Add Notes..." 
              className="resize-none bg-background/50 border-border/50 shadow-sm h-20 text-sm" 
            />
          </div>
        </div>
        
        <div className="flex flex-row items-center justify-between border-t px-5 py-4 shrink-0 gap-2">
          {isEditing ? (
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white">Delete</Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-muted">Cancel</Button>
            <Button
              type="submit"
              onClick={handleSave}
              disabled={!title || updateEvent.isPending || createEvent.isPending}
              className="shadow-md"
            >
              {isEditing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
