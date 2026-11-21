'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTil } from '@/components/app/til-provayder'
import { kalitSozlarniAjrat, type ParseNatijasi } from './parse'
import type { TaskPriority } from '@/types/vazifalar'

/**
 * Nom maydonidagi kalit so'zlarni vazifa maydonlariga ulaydi.
 *
 * Nega hook: bu mantiq vazifa oynasida ham, tezkor qo'shishda ham
 * bir xil kerak. Ikkala joyda qayta yozilsa, ular asta-sekin
 * bir-biridan farq qila boshlaydi.
 *
 * Qo'llash qoidasi: parser biror qiymat topsa — maydon darhol
 * to'ladi. Keyin o'sha kalit so'z matndan olib tashlansa (yoki
 * bekor qilinsa), maydon ham tozalanadi. Ya'ni maydon matnga
 * ergashadi, lekin faqat parser QO'YGAN qiymat uchun: qo'lda
 * tanlangan sanaga tegilmaydi.
 */
export type KalitQollanma = {
  sana?: string | null
  vaqt?: string | null
  rrule?: string | null
  muhimlik?: TaskPriority | null
}

export function useKalitSozlar(
  matn: string,
  qolla: (ozgarish: KalitQollanma) => void,
  /**
   * Tahrirlashda — vazifaning SAQLANGAN nomi.
   *
   * Nega kerak: "Ertaga uchrashuv" deb saqlangan vazifa ochilganda
   * parser "ertaga" so'zini topib, sanani o'zgartirib yuborardi va
   * saqlashda so'zni nomdan olib tashlardi — odam hech narsa
   * yozmagan bo'lsa ham. Shuning uchun mavjud nomdagi belgilar
   * boshidanoq "bekor qilingan" hisoblanadi; foydalanuvchi yangi
   * kalit so'z yozsa, u odatdagidek taniladi.
   */
  boshlangichNom?: string
) {
  const { til } = useTil()
  const [bekorlar, setBekorlar] = useState<string[]>(() =>
    boshlangichNom
      ? kalitSozlarniAjrat(boshlangichNom, { til }).belgilar.map((b) => b.matn)
      : []
  )

  const tahlil = useMemo(
    () => kalitSozlarniAjrat(matn, { til, bekorlar }),
    [matn, til, bekorlar]
  )

  // `qolla` har renderda yangi funksiya bo'ladi — effekt uni
  // bog'liqlik sifatida olsa, cheksiz aylanardi
  const qollaRef = useRef(qolla)
  qollaRef.current = qolla

  /*
    Oldingi marta parser QO'YGAN qiymatlar.

    Boshlang'ich qiymat ATAYLAB `{}` emas, balki hammasi `null`:
    `matn` bo'sh bo'lganda `tahlil`ning har bir maydoni ham `null`
    bo'ladi. Agar bu yerda `{}` tursa, birinchi effektda
    `null !== undefined` farq sifatida ko'rinib, `qolla({sana: null,
    ...})` chaqirilardi — natijada chaqiruvchi bergan `defaultDate`
    (masalan, "Bugun" sahifasida bugungi sana) komponent mont
    bo'lgan zahoti, hech narsa yozilmasdan turib, `null`ga
    tozalanib ketardi.
  */
  const oldingi = useRef<KalitQollanma>({
    sana: null,
    vaqt: null,
    rrule: null,
    muhimlik: null,
  })

  useEffect(() => {
    const ozgarish: KalitQollanma = {}

    if (tahlil.sana !== oldingi.current.sana) {
      ozgarish.sana = tahlil.sana
    }
    if (tahlil.vaqt !== oldingi.current.vaqt) {
      ozgarish.vaqt = tahlil.vaqt
    }
    if (tahlil.rrule !== oldingi.current.rrule) {
      ozgarish.rrule = tahlil.rrule
    }
    if (tahlil.muhimlik !== oldingi.current.muhimlik) {
      ozgarish.muhimlik = tahlil.muhimlik
    }

    oldingi.current = {
      sana: tahlil.sana,
      vaqt: tahlil.vaqt,
      rrule: tahlil.rrule,
      muhimlik: tahlil.muhimlik,
    }

    if (Object.keys(ozgarish).length > 0) qollaRef.current(ozgarish)
  }, [tahlil])

  const bekorQil = useCallback((belgiMatni: string) => {
    setBekorlar((eski) =>
      eski.includes(belgiMatni) ? eski : [...eski, belgiMatni]
    )
  }, [])

  /** Yangi vazifaga o'tilganda ro'yxat tozalanadi */
  const tozala = useCallback(() => {
    setBekorlar([])
    // `{}` emas — yuqoridagi izohdagi sabab shu yerda ham amal qiladi:
    // tezkor qo'shishda ketma-ket vazifa qo'shilganda, har safar
    // tozalashdan keyin ham `defaultDate` darhol tozalanib ketmasligi
    // kerak.
    oldingi.current = { sana: null, vaqt: null, rrule: null, muhimlik: null }
  }, [])

  return { tahlil, bekorQil, tozala } as {
    tahlil: ParseNatijasi
    bekorQil: (belgiMatni: string) => void
    tozala: () => void
  }
}
