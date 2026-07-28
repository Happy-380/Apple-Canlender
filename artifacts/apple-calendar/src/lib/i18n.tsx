/**
 * Minimal i18n — language follows the browser/OS setting automatically.
 * zh-* → Chinese, everything else → English.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'zh' | 'en'

function detectLang(): Lang {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

// ─── String table ─────────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    // Header
    today:       'Today',
    newEvent:    'New Event',
    views:       { day: 'Day', week: 'Week', month: 'Month', year: 'Year', schedule: 'Schedule' },
    schedule:    'Schedule',
    // Event modal
    newEventTitle:  'New Event',
    editEventTitle: 'Edit Event',
    eventPlaceholder: 'Event title',
    allDay:  'All-day',
    starts:  'Starts',
    ends:    'Ends',
    addLocation: 'Add Location',
    calendar:    'Calendar',
    addTag:      '+ Add Tag',
    addAlert:    '+ Add Alert',
    addNotes:    'Add Notes...',
    delete:      'Delete',
    cancel:      'Cancel',
    save:        'Save',
    add:         'Add',
    noTags:      'No tags exist.',
    // Reminder options
    reminders: [
      { value: 0,    label: 'At time of event' },
      { value: 5,    label: '5 minutes before' },
      { value: 15,   label: '15 minutes before' },
      { value: 30,   label: '30 minutes before' },
      { value: 60,   label: '1 hour before' },
      { value: 1440, label: '1 day before' },
    ],
    minsBefore: (m: number) => `${m} minutes before`,
    // Sidebar
    myCalendars:     'My Calendars',
    tags:            'Tags',
    name:            'Name',
    color:           'Color',
    deleteCalendar:  'Delete Calendar',
    deleteTag:       'Delete Tag',
    newCalendarPlaceholder: 'New Calendar',
    newTagPlaceholder:      'New Tag',
    // Schedule view
    noEvents:     'No events yet',
    noEventsHint: 'Tap + to create your first event.',
    allDayLabel:  'All day',
    todayBadge:   'Today',
    // Mini-calendar weekday headers
    miniWeekdays:  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    // Month view weekday headers
    monthWeekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    // Year view single-letter headers
    yearWeekdays:  ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  },

  zh: {
    today:       '今天',
    newEvent:    '新建',
    views:       { day: '日', week: '周', month: '月', year: '年', schedule: '日程' },
    schedule:    '日程',
    newEventTitle:  '新建日程',
    editEventTitle: '编辑日程',
    eventPlaceholder: '日程标题',
    allDay:  '全天',
    starts:  '开始',
    ends:    '结束',
    addLocation: '添加地点',
    calendar:    '日历',
    addTag:      '+ 添加标签',
    addAlert:    '+ 添加提醒',
    addNotes:    '添加备注…',
    delete:      '删除',
    cancel:      '取消',
    save:        '保存',
    add:         '添加',
    noTags:      '暂无标签',
    reminders: [
      { value: 0,    label: '事件发生时' },
      { value: 5,    label: '5 分钟前' },
      { value: 15,   label: '15 分钟前' },
      { value: 30,   label: '30 分钟前' },
      { value: 60,   label: '1 小时前' },
      { value: 1440, label: '1 天前' },
    ],
    minsBefore: (m: number) => `${m} 分钟前`,
    myCalendars:     '我的日历',
    tags:            '标签',
    name:            '名称',
    color:           '颜色',
    deleteCalendar:  '删除日历',
    deleteTag:       '删除标签',
    newCalendarPlaceholder: '新建日历',
    newTagPlaceholder:      '新建标签',
    noEvents:     '暂无日程',
    noEventsHint: '点击 + 创建第一个日程',
    allDayLabel:  '全天',
    todayBadge:   '今天',
    miniWeekdays:  ['日', '一', '二', '三', '四', '五', '六'],
    monthWeekdays: ['日', '一', '二', '三', '四', '五', '六'],
    yearWeekdays:  ['日', '一', '二', '三', '四', '五', '六'],
  },
} as const

export type Strings = typeof STRINGS['en']

// ─── Context ──────────────────────────────────────────────────────────────────
const LocaleContext = createContext<Strings>(STRINGS['en'])

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [strings, setStrings] = useState<Strings>(() => STRINGS[detectLang()])

  useEffect(() => {
    const update = () => setStrings(STRINGS[detectLang()])
    window.addEventListener('languagechange', update)
    return () => window.removeEventListener('languagechange', update)
  }, [])

  return <LocaleContext.Provider value={strings}>{children}</LocaleContext.Provider>
}

/** Returns the full translation object for the current system language. */
export function useStrings(): Strings {
  return useContext(LocaleContext)
}
