'use client'

import { useMemo, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
import { useProfil, useProfilYangilash } from '@/lib/queries/profil'

/** Brauzer ro'yxat bermasa — kamida shular bo'lsin */
const ZAXIRA_MINTAQALAR = [
  'Asia/Tashkent',
  'Asia/Samarkand',
  'Asia/Almaty',
  'Asia/Dubai',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/London',
  'UTC',
]

function mintaqalarRoyxati(): string[] {
  const Intl_ = Intl as typeof Intl & {
    supportedValuesOf?: (kalit: string) => string[]
  }
  try {
    const royxat = Intl_.supportedValuesOf?.('timeZone')
    if (royxat && royxat.length > 0) return royxat
  } catch {
    // Eski brauzerlar — zaxira ro'yxat ishlatiladi
  }
  return ZAXIRA_MINTAQALAR
}

export function UmumiyBolimi() {
  const { data: profil } = useProfil()
  const yangilash = useProfilYangilash()
  const { korsat } = useToast()
  const [saqlanmoqda, setSaqlanmoqda] = useState(false)

  const mintaqalar = useMemo(mintaqalarRoyxati, [])
  const joriy = profil?.timezone ?? 'Asia/Tashkent'
  const qurilmadagi = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Saqlangan mintaqa ro'yxatda bo'lmasa ham ko'rinsin
  const variantlar = mintaqalar.includes(joriy)
    ? mintaqalar
    : [joriy, ...mintaqalar]

  async function ornat(mintaqa: string) {
    if (mintaqa === joriy) return
    setSaqlanmoqda(true)
    try {
      await yangilash.mutateAsync({ timezone: mintaqa })
      korsat({ matn: 'Vaqt mintaqasi saqlandi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    } finally {
      setSaqlanmoqda(false)
    }
  }

  const hozir = new Date().toLocaleTimeString('uz-UZ', {
    timeZone: joriy,
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-4">
      <SozlamaKartasi
        sarlavha="Vaqt mintaqasi"
        tavsif={`Eslatmalar shu mintaqa bo‘yicha yuboriladi. Hozir u yerda soat ${hozir}.`}
      >
        <div className="space-y-2">
          <select
            value={joriy}
            onChange={(e) => ornat(e.target.value)}
            disabled={saqlanmoqda}
            aria-label="Vaqt mintaqasi"
            className="min-h-touch w-full rounded-xl border border-border-subtle bg-surface px-4 text-base text-text-strong outline-none focus:border-brand-onsoft disabled:opacity-50"
          >
            {variantlar.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {qurilmadagi && qurilmadagi !== joriy && (
            <button
              type="button"
              onClick={() => ornat(qurilmadagi)}
              disabled={saqlanmoqda}
              className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
            >
              <LocateFixed className="size-4" aria-hidden />
              Qurilmadagisini olish ({qurilmadagi})
            </button>
          )}
        </div>
      </SozlamaKartasi>
    </div>
  )
}
