import {
  BookOpen,
  Briefcase,
  CircleDollarSign,
  Dumbbell,
  FolderKanban,
  GraduationCap,
  Heart,
  House,
  Inbox,
  Plane,
  ShoppingCart,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Papka uchun tanlanadigan ranglar */
export const PAPKA_RANGLARI = [
  { hex: '#003933', nom: 'To‘q yashil' },
  { hex: '#00bc55', nom: 'Yashil' },
  { hex: '#0ea5e9', nom: 'Moviy' },
  { hex: '#6366f1', nom: 'Siyohrang' },
  { hex: '#a855f7', nom: 'Binafsha' },
  { hex: '#ec4899', nom: 'Pushti' },
  { hex: '#ef4444', nom: 'Qizil' },
  { hex: '#f59e0b', nom: 'Sariq' },
  { hex: '#14b8a6', nom: 'Firuza' },
  { hex: '#64748b', nom: 'Kulrang' },
] as const

export const PAPKA_IKONKALARI: Record<string, LucideIcon> = {
  inbox: Inbox,
  papka: FolderKanban,
  ish: Briefcase,
  oqish: GraduationCap,
  kitob: BookOpen,
  uy: House,
  sogliq: Heart,
  sport: Dumbbell,
  xarid: ShoppingCart,
  pul: CircleDollarSign,
  oila: Users,
  sayohat: Plane,
  yulduz: Star,
  goya: Sparkles,
}

export const IKONKA_RUYXATI = Object.keys(PAPKA_IKONKALARI)

export function papkaIkonkasi(nom: string | null, isInbox = false): LucideIcon {
  if (isInbox) return Inbox
  return PAPKA_IKONKALARI[nom ?? 'papka'] ?? FolderKanban
}

/** Yangi papka yaratishda taklif qilinadigan tayyor nomlar */
export const SHABLON_PAPKALAR = [
  { name: 'Ish', icon: 'ish', color: '#0ea5e9' },
  { name: 'O‘qish', icon: 'oqish', color: '#6366f1' },
  { name: 'Uy', icon: 'uy', color: '#14b8a6' },
  { name: 'Sog‘liq', icon: 'sogliq', color: '#ef4444' },
  { name: 'Xaridlar', icon: 'xarid', color: '#f59e0b' },
  { name: 'Moliyaviy', icon: 'pul', color: '#00bc55' },
  { name: 'Shaxsiy', icon: 'yulduz', color: '#a855f7' },
  { name: 'Loyihalar', icon: 'papka', color: '#64748b' },
] as const

/** Muhimlik ranglari — brenddan qat'i nazar o'zgarmaydi */
export const MUHIMLIK_RANGI: Record<number, string> = {
  1: '#dc2626',
  2: '#ea580c',
  3: '#2563eb',
  4: '#9ca3af',
}

export const MUHIMLIK_NOMI: Record<number, string> = {
  1: 'Juda muhim',
  2: 'Muhim',
  3: 'O‘rtacha',
  4: 'Oddiy',
}
