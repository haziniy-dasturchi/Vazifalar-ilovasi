import type { Task } from '@/types/vazifalar'

/**
 * Vazifalarni ota va subtasklarga ajratish (iyerarxiya faqat 1 daraja).
 *
 * Muhim: "Bugun" yoki "Kelgusi" kabi ro'yxatlarda subtask ko'rinib,
 * uning ota-vazifasi ro'yxatga tushmasligi mumkin (masalan, ota-vazifa
 * sanasi boshqa kun). Bunday subtask yo'qolib qolmasligi uchun u
 * mustaqil qator sifatida ko'rsatiladi.
 */
export function iyerarxiya(vazifalar: Task[]) {
  const mavjudId = new Set(vazifalar.map((v) => v.id))
  const otalar: Task[] = []
  const bolalar = new Map<string, Task[]>()

  for (const v of vazifalar) {
    const otaRoyxatda = v.parent_id !== null && mavjudId.has(v.parent_id)

    if (otaRoyxatda) {
      const royxat = bolalar.get(v.parent_id!)
      if (royxat) royxat.push(v)
      else bolalar.set(v.parent_id!, [v])
    } else {
      otalar.push(v)
    }
  }

  return { otalar, bolalar }
}

/** Ro'yxatda faqat ota-vazifalarni ko'rsatish uchun: subtasklari bor-yo'qligi */
export function subtasklar(bolalar: Map<string, Task[]>, otaId: string) {
  return bolalar.get(otaId) ?? []
}

/** Muhimlik va tartib bo'yicha saralash */
export function saralash(vazifalar: Task[]): Task[] {
  return [...vazifalar].sort(
    (a, b) =>
      a.priority - b.priority ||
      a.sort_order - b.sort_order ||
      a.created_at.localeCompare(b.created_at)
  )
}
