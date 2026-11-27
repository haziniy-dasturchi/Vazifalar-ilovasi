import type { Topshiriq } from '@/types/vazifalar'

/**
 * Ochiq (javob kutilayotgan yoki ishdagi) topshiriqning muddati
 * o'tganmi. Sana bugun bo'lsa — soatga ham qaraladi.
 */
export function kechikkanmi(t: Topshiriq, bugun: string, hozir = new Date()): boolean {
  if (!t.muddat) return false
  if (t.holat !== 'kutilmoqda' && t.holat !== 'qabul') return false
  if (t.muddat < bugun) return true
  if (t.muddat > bugun || !t.muddat_vaqt) return false
  const [soat, daqiqa] = t.muddat_vaqt.split(':').map(Number)
  return hozir.getHours() * 60 + hozir.getMinutes() > soat * 60 + daqiqa
}

export type XodimHisoboti = {
  email: string
  jami: number
  ochiq: number
  kechikkan: number
  bajarilgan: number
  rad: number
  /** Muddati bor bajarilganlardan muddatida topshirilganlar ulushi, % */
  muddatida: number | null
  /** Yuborilgandan topshirilgunicha o'rtacha soat */
  ortachaSoat: number | null
  ortachaBaho: number | null
}

/**
 * Men yuborgan topshiriqlar bo'yicha — har bir ijrochi kesimida.
 * Hammasi mijozda hisoblanadi: ma'lumot allaqachon yuklangan, alohida
 * server so'rovi va undagi maxfiylik qoidalari kerak emas.
 */
export function xodimlarHisoboti(royxat: Topshiriq[], bugun: string): XodimHisoboti[] {
  const guruhlar = new Map<string, Topshiriq[]>()
  for (const t of royxat) {
    const g = guruhlar.get(t.qabul_qiluvchi_email) ?? []
    g.push(t)
    guruhlar.set(t.qabul_qiluvchi_email, g)
  }

  const natija: XodimHisoboti[] = []
  for (const [email, g] of guruhlar) {
    const bajarilgan = g.filter((t) => t.holat === 'bajarildi')
    const muddatli = bajarilgan.filter((t) => t.muddat)
    const vaqtida = muddatli.filter((t) => {
      const qachon = (t.topshirilgan_at ?? t.tasdiqlangan_at ?? t.javob_at ?? '').slice(0, 10)
      return qachon !== '' && qachon <= (t.muddat as string)
    })
    const soatlar = g
      .filter((t) => t.topshirilgan_at)
      .map(
        (t) =>
          (new Date(t.topshirilgan_at as string).getTime() - new Date(t.created_at).getTime()) /
          3_600_000
      )
      .filter((s) => s >= 0)
    const baholar = g.map((t) => t.baho).filter((b): b is number => b != null)

    natija.push({
      email,
      jami: g.length,
      ochiq: g.filter((t) => ['kutilmoqda', 'qabul', 'tekshiruvda'].includes(t.holat)).length,
      kechikkan: g.filter((t) => kechikkanmi(t, bugun)).length,
      bajarilgan: bajarilgan.length,
      rad: g.filter((t) => t.holat === 'rad').length,
      muddatida: muddatli.length ? Math.round((vaqtida.length / muddatli.length) * 100) : null,
      ortachaSoat: soatlar.length ? soatlar.reduce((a, b) => a + b, 0) / soatlar.length : null,
      ortachaBaho: baholar.length
        ? Math.round((baholar.reduce((a, b) => a + b, 0) / baholar.length) * 10) / 10
        : null,
    })
  }
  // Kechikkani ko'p — tepada: rahbar avval muammoni ko'rsin
  return natija.sort((a, b) => b.kechikkan - a.kechikkan || b.ochiq - a.ochiq || b.jami - a.jami)
}
