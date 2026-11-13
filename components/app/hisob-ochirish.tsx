'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { TriangleAlert, UserX } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

/** Tasdiqlash uchun yoziladigan so'z */
const TASDIQ_SOZI = 'O‘CHIRISH'

/**
 * Yozilgan so'zni solishtirishga tayyorlaydi.
 *
 * Apostrof muammosi: biz ekranda tipografik apostrof (') ko'rsatamiz,
 * telefon klaviaturasi esa odatda oddiy tirnoq (') chiqaradi. Aynan
 * belgima-belgi solishtirsak, foydalanuvchi to'g'ri yozsa ham tugma
 * ochilmay, u hisobini o'chira olmay qolardi — bu Google Play uchun
 * majburiy imkoniyat bo'lgani uchun jiddiy nuqson.
 *
 * Shuning uchun har qanday apostrof turini (va umuman apostrofsiz
 * yozilgan "OCHIRISH" ni ham) qabul qilamiz. Himoya pasaymaydi:
 * maqsad tasodifan bosib yuborishdan saqlash edi, imlo imtihoni emas.
 */
function soddalashtir(matn: string): string {
  return matn.trim().toUpperCase().replace(/[‘’'`´ʻ]/g, '')
}

/**
 * Hisobni butunlay o'chirish.
 *
 * Google Play 2024-yildan beri buni TALAB QILADI: hisob yaratish
 * imkoni bor ilovada foydalanuvchi hisobini ilova ichidan o'chira
 * olishi shart.
 *
 * Qaytarib bo'lmaydigan amal bo'lgani uchun oddiy "Ha/Yo'q" yetarli
 * emas — foydalanuvchi tasdiq so'zini qo'lda yozadi. Bu tasodifan
 * bosib yuborishning oldini oladi.
 */
export function HisobOchirish() {
  const [ochiq, setOchiq] = useState(false)

  return (
    <>
      <div className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-card">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-danger-soft">
          <UserX className="size-5 text-danger" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">Hisobni o‘chirish</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            Hisobingiz va barcha vazifalaringiz butunlay o‘chadi. Buni
            qaytarib bo‘lmaydi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOchiq(true)}
          className="min-h-touch shrink-0 rounded-xl border border-danger/35 px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
        >
          O‘chirish
        </button>
      </div>

      {ochiq && <TasdiqOynasi yop={() => setOchiq(false)} />}
    </>
  )
}

function TasdiqOynasi({ yop }: { yop: () => void }) {
  const [matn, setMatn] = useState('')
  const [bajarilmoqda, setBajarilmoqda] = useState(false)
  const { korsat } = useToast()
  const router = useRouter()
  const qc = useQueryClient()

  const tayyor = soddalashtir(matn) === soddalashtir(TASDIQ_SOZI)

  async function ochir() {
    if (!tayyor || bajarilmoqda) return
    setBajarilmoqda(true)

    const supabase = createClient()
    const { error } = await supabase.rpc('hisobni_ochirish')

    if (error) {
      setBajarilmoqda(false)
      korsat({
        matn: 'O‘chirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.',
        tone: 'xato',
      })
      return
    }

    // Hisob yo'q — sessiya ham, qurilmadagi kesh ham qolmasligi kerak
    await supabase.auth.signOut()
    qc.clear()
    router.replace('/kirish')
  }

  return (
    <Oyna
      sarlavha="Hisobni o‘chirish"
      tavsif="Bu amalni qaytarib bo‘lmaydi"
      yop={bajarilmoqda ? () => {} : yop}
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-danger/35 bg-danger-soft p-4">
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-danger"
            aria-hidden
          />
          <div className="text-sm leading-relaxed text-danger">
            <p className="font-semibold">Nimalar o‘chadi:</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>Hisobingiz va profilingiz</li>
              <li>Barcha vazifalar, papkalar va loyihalar</li>
              <li>Bajarilish tarixi va hisobotlar</li>
            </ul>
            <p className="mt-2">Zaxira nusxa saqlanmaydi.</p>
          </div>
        </div>

        <div>
          <label
            htmlFor="tasdiq-sozi"
            className="block text-sm text-text-muted"
          >
            Davom etish uchun <strong className="text-text-strong">{TASDIQ_SOZI}</strong>{' '}
            so‘zini yozing
          </label>
          <input
            id="tasdiq-sozi"
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            disabled={bajarilmoqda}
            autoComplete="off"
            autoFocus
            className="mt-2 min-h-touch w-full rounded-xl border border-border-subtle bg-surface px-3 text-base text-text-strong outline-none focus:border-red-400"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={yop}
            disabled={bajarilmoqda}
            className="min-h-touch rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={ochir}
            disabled={!tayyor || bajarilmoqda}
            className="min-h-touch rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
          >
            {bajarilmoqda ? 'O‘chirilmoqda…' : 'Butunlay o‘chirish'}
          </button>
        </div>
      </div>
    </Oyna>
  )
}
