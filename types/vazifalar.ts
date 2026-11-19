/**
 * Vazifalar — ilova darajasidagi yordamchi tiplar.
 *
 * `database.ts` ni `supabase gen types` qayta yozadi, shuning uchun
 * qo'lda yozilgan tiplar shu faylda turadi.
 */

import type { Tables } from './database'

// -------------------------------------------------------------
// Sanab o'tiladigan qiymatlar (bazada TEXT + CHECK bilan cheklangan)
// -------------------------------------------------------------
export const TASK_STATUSES = ['planned', 'in_progress', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** 1 = eng muhim ... 4 = eng past (default) */
export const TASK_PRIORITIES = [1, 2, 3, 4] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const RECURRENCES = ['daily', 'weekdays', 'weekly', 'monthly'] as const
export type OddiyTakrorlanish = (typeof RECURRENCES)[number]

/**
 * Tanlangan hafta kunlari: `days:2,3,4` (ISO — 1 dushanba ... 7 yakshanba).
 *
 * Nega shablon tipi: shu bilan TypeScript `'days:2,3'` ni qabul qiladi,
 * lekin `'days:'` yoki `'kunlar:2'` ni rad etadi. Aniq raqamlarni
 * tekshirish tip darajasida imkonsiz — buni `takrorKunlari()` va
 * bazadagi CHECK cheklovi bajaradi.
 */
export type KunlarTakrorlanishi = `days:${string}`

export type Recurrence = OddiyTakrorlanish | KunlarTakrorlanishi

export const POMODORO_KINDS = ['focus', 'short_break', 'long_break'] as const
export type PomodoroKind = (typeof POMODORO_KINDS)[number]

export const TASK_EVENTS = [
  'created',
  'started',
  'moved_back',
  'completed',
  'uncompleted',
] as const
export type TaskEventKind = (typeof TASK_EVENTS)[number]

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const FOLDER_HEALTHS = ['good', 'attention', 'behind'] as const
export type FolderHealth = (typeof FOLDER_HEALTHS)[number]

// -------------------------------------------------------------
// Jadval qatorlari, aniqlashtirilgan maydonlar bilan
// -------------------------------------------------------------
export type Profile = Omit<Tables<'profiles'>, 'theme'> & { theme: Theme }

export type Folder = Tables<'folders'>
export type Section = Tables<'sections'>
export type Label = Tables<'labels'>
export type TaskLabel = Tables<'task_labels'>

export type Task = Omit<
  Tables<'tasks'>,
  'status' | 'priority' | 'recurrence'
> & {
  status: TaskStatus
  priority: TaskPriority
  recurrence: Recurrence | null
}

export type PomodoroSession = Omit<Tables<'pomodoro_sessions'>, 'kind'> & {
  kind: PomodoroKind
}

export type TaskEvent = Omit<Tables<'task_events'>, 'event'> & {
  event: TaskEventKind
}

// -------------------------------------------------------------
// get_report RPC natijasi (bazada jsonb qaytadi)
// -------------------------------------------------------------
export type ReportSummary = {
  /** Davrda bajarilgan vazifalar soni ('completed' hodisalari) */
  completed: number
  /** Oldingi shu uzunlikdagi davrda bajarilganlar soni */
  completed_prev: number
  /** Tugallangan fokus sessiyalarining haqiqiy davomiyligi (daqiqa) */
  focus_minutes: number
  /** Muddatida bajarilganlar foizi; ma'lumot bo'lmasa null */
  on_time_rate: number | null
  /** Hozirda ochiq va kechikkan vazifalar soni */
  overdue_open: number
}

export type ReportDay = {
  /** YYYY-MM-DD */
  date: string
  completed: number
}

export type ReportFolder = {
  folder_id: string
  name: string
  color: string
  completed: number
  open: number
  overdue: number
  focus_minutes: number
  /** Oxirgi task_events yozuvi vaqti; hodisa bo'lmasa null */
  last_activity_at: string | null
  health: FolderHealth
  /** O'zbekcha qisqa sabab, masalan "Bu davrda 0 ta vazifa bajarilmagan" */
  reason: string
}

export type ReportResult = {
  summary: ReportSummary
  by_day: ReportDay[]
  by_folder: ReportFolder[]
}

// -------------------------------------------------------------
// Topshiriqlar — foydalanuvchidan foydalanuvchiga
// -------------------------------------------------------------
export const TOPSHIRIQ_HOLATLARI = [
  'kutilmoqda',
  'qabul',
  'rad',
  'bajarildi',
] as const
export type TopshiriqHolati = (typeof TOPSHIRIQ_HOLATLARI)[number]

/**
 * Qo'lda yozilgan tip: `types/database.ts` Supabase'dan generatsiya
 * qilinadi va bu jadval unga hali tushmagan. Generatsiya qayta
 * ishga tushirilganda bu yerdagi tip o'rniga o'shanisi ishlatiladi.
 */
export type Topshiriq = {
  id: string
  yuboruvchi_id: string
  qabul_qiluvchi_email: string
  sarlavha: string
  izoh: string | null
  muddat: string | null
  muhimlik: TaskPriority
  holat: TopshiriqHolati
  rad_sababi: string | null
  vazifa_id: string | null
  bildirildi_at: string | null
  created_at: string
  javob_at: string | null
}
