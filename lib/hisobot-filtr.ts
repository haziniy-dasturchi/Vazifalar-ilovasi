/**
 * Hisobotdagi "Qisman bajarilgan ishlar" ro'yxatini yig'ish.
 *
 * Nega alohida fayl: bu mantiqda ikkita nozik qoida bor (quyida) va
 * ularni UI ichida tekshirib bo'lmaydi. Shu yerda sof funksiya —
 * demak testlanadi.
 *
 * --- Muammo nimada edi ---
 * Avval ro'yxat faqat "davr ichida foizi oshgan" vazifalardan
 * tuzilardi. Vazifa 0% dan 100% ga chiqqan bo'lsa, u ham shu
 * ro'yxatga tushardi — ayni paytda "bajarildi" kartasida ham
 * sanalardi. Ya'ni bitta ish ikki marta hisoblanardi va "qisman"
 * ro'yxatida aslida TO'LIQ bajarilgan ishlar turardi.
 *
 * --- Yangi qoida ---
 * Ro'yxatda faqat HOZIR yarim yo'lda turgan ishlar qoladi:
 * `0 < joriy foiz < 100`. To'liq bajarilganlar "bajarildi" hisobiga
 * o'tadi, 0% ga qaytarilganlar esa umuman qoladigan ish emas.
 */

/** `task_progress_log` dagi bitta o'zgarish + vazifaning hozirgi holati */
export type JurnalQatori = {
  task_id: string
  sarlavha: string
  /** O'zgarishdan oldingi foiz */
  oldingi: number
  /** O'zgarishdan keyingi foiz */
  yangi: number
  /** Vazifaning HOZIRGI foizi (jurnal emas, `tasks.progress`) */
  joriyFoiz: number
  /** Vazifa hozir bajarilgan holatdami */
  bajarilganmi: boolean
}

export type QismanYozuv = {
  task_id: string
  sarlavha: string
  /** Davr ichida to'plangan sof o'sish, foizda */
  osish: number
  /** Vazifaning hozirgi bajarilish foizi */
  joriyFoiz: number
}

/**
 * Davr jurnalidan "yarim yo'ldagi ishlar" ro'yxatini tuzadi.
 *
 * Bitta vazifa bir davrda bir necha marta o'zgarishi mumkin —
 * o'zgarishlar qo'shilib, bitta qatorga jamlanadi.
 */
export function qismanBajarilganlar(qatorlar: JurnalQatori[]): QismanYozuv[] {
  const jami = new Map<string, QismanYozuv>()

  for (const q of qatorlar) {
    const farq = q.yangi - q.oldingi
    const avvalgi = jami.get(q.task_id)
    if (avvalgi) {
      avvalgi.osish += farq
      // Joriy holat jurnalga bog'liq emas, lekin qatorlar orasida
      // farq qilib qolmasligi uchun oxirgisini olamiz
      avvalgi.joriyFoiz = q.joriyFoiz
    } else {
      jami.set(q.task_id, {
        task_id: q.task_id,
        sarlavha: q.sarlavha,
        osish: farq,
        joriyFoiz: q.joriyFoiz,
      })
    }
  }

  const bajarilgan = new Set(
    qatorlar.filter((q) => q.bajarilganmi).map((q) => q.task_id)
  )

  return [...jami.values()]
    .filter(
      (y) =>
        // Davrda haqiqiy oldinga siljish bo'lgan (qaytarishlar emas)
        y.osish > 0 &&
        // ...va ish hozir hamon yarim yo'lda
        y.joriyFoiz > 0 &&
        y.joriyFoiz < 100 &&
        !bajarilgan.has(y.task_id)
    )
    .sort((a, b) => b.osish - a.osish)
}

export type QismanXulosa = {
  /** Ro'yxatdagi vazifalar soni */
  soni: number
  /** Ularning hozirgi foizlarining o'rtachasi, butun songa yaxlitlangan */
  ortacha: number
}

/**
 * Bo'lim sarlavhasidagi ko'rsatkich.
 *
 * Avval bu yerda barcha o'sishlarning yig'indisi turardi ("+2460%").
 * U foiz emas, turli vazifalarning foiz punktlari yig'indisi edi —
 * hech narsaga nisbatan bo'lmagani uchun chalg'ituvchi. Endi:
 * nechta ish yarim yo'lda va ular o'rtacha qay darajada tugagan.
 */
export function qismanXulosa(royxat: QismanYozuv[]): QismanXulosa {
  if (royxat.length === 0) return { soni: 0, ortacha: 0 }
  const yigindi = royxat.reduce((s, y) => s + y.joriyFoiz, 0)
  return {
    soni: royxat.length,
    ortacha: Math.round(yigindi / royxat.length),
  }
}
