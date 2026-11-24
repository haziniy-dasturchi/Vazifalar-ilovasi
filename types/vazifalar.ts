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

/**
 * ESKI takrorlanish shakllari (`tasks.recurrence` ustuni).
 *
 * Yangi kod takrorlanishni `tasks.rrule` da, RFC 5545 RRULE matni
 * sifatida saqlaydi (`lib/takrorlanish`). Bu ustun faqat orqaga
 * moslik uchun to'ldirib boriladi: foydalanuvchining telefonidagi
 * PWA keshida eski JS qolgan bo'lishi mumkin va u hamon shu
 * ustunni o'qiydi. Keyingi relizlardan birida olib tashlanadi.
 */
export const RECURRENCES = ['daily', 'weekdays', 'weekly', 'monthly'] as const
export type OddiyTakrorlanish = (typeof RECURRENCES)[number]

/** Tanlangan hafta kunlari: `days:2,3,4` (ISO — 1 dushanba ... 7 yakshanba) */
export type KunlarTakrorlanishi = `days:${string}`

/** @deprecated Yangi kod `Task['rrule']` dan foydalanadi */
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
  'tekshiruvda',
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
  /** Muddat soati, `HH:MM:SS` (faqat `muddat` bilan birga) */
  muddat_vaqt?: string | null
  /** Qachondan boshlab (ijrochi vazifasining reja kuni) */
  boshlanish?: string | null
  /** true: ijrochi tugatganda yuboruvchi tasdiqlaydi */
  tekshirish?: boolean
  topshirish_izohi?: string | null
  topshirilgan_at?: string | null
  qaytarish_sababi?: string | null
  tasdiqlangan_at?: string | null
  /** Bir yuborishda bir nechta odamga ketgan nusxalar umumiy belgisi */
  guruh_id?: string | null
  takror?: TopshiriqTakrori | null
  oldingi_id?: string | null
  /** Yuboruvchi bahosi, 1-5 (tasdiqlashda) */
  baho?: number | null
  /** Jamoa ichida yuborilgani uchun o'zi qabul qilingan */
  avto_qabul?: boolean
}

export const TOPSHIRIQ_TAKRORLARI = ['kunlik', 'haftalik', 'oylik'] as const
export type TopshiriqTakrori = (typeof TOPSHIRIQ_TAKRORLARI)[number]

export type TopshiriqIzohi = {
  id: string
  topshiriq_id: string
  muallif_id: string
  matn: string | null
  fayl_yoli: string | null
  fayl_nomi: string | null
  fayl_hajmi: number | null
  fayl_turi: string | null
  created_at: string
}

export type TopshiriqHodisasi = {
  id: number
  topshiriq_id: string
  kim_id: string | null
  hodisa: string
  izoh: string | null
  created_at: string
}

export type Jamoa = {
  id: string
  nom: string
  egasi_id: string
  taklif_kodi: string
  created_at: string
}

export type JamoaAzosi = {
  jamoa_id: string
  user_id: string
  email: string
  ism: string | null
  rol: 'rahbar' | 'azo'
}
