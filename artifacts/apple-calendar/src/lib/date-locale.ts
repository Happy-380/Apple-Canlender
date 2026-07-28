/**
 * Returns the correct date-fns locale for the current system language.
 * Imported lazily per call — Vite tree-shakes unused locales.
 */
import { zhCN, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'

export function getDateLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('zh') ? zhCN : enUS
}
