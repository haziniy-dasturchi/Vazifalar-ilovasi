'use client'

import { Copy, Send, Share2 } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { DOMEN } from '@/lib/huquqiy'
import { useMeningTaklifKodim } from '@/lib/queries/topshiriq-jamoa'

/**
 * Ilovani yuklab olish/ochish manzili. Play Market'ga chiqqach shu
 * yerga do'kon havolasi qo'yiladi — hamma taklif matnlari o'zgaradi.
 */
export const ILOVA_HAVOLASI = DOMEN

export const shaxsiyHavola = (kod: string) => `${DOMEN}/topshiriqlar?taklif=${kod}`

/** Capacitor ilovasi ichidami (import qilmasdan — veb build'ga tegmaydi) */
function ilovadami(): boolean {
  const c = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return Boolean(c?.isNativePlatform?.())
}

/** Tashqi havolani ochish: ilovada tizim (Telegram ilovasi) ochadi */
function tashqiOch(havola: string) {
  if (ilovadami()) {
    // Capacitor begona manzilni WebView'da emas, tizimda ochadi —
    // t.me havolasini esa Telegram ilovasi ushlab oladi
    window.location.href = havola
  } else {
    window.open(havola, '_blank', 'noopener')
  }
}

/**
 * Taklif oynasi. Oldin to'g'ridan-to'g'ri tizimning "Ulashish"
 * oynasi chaqirilardi — ba'zi qurilmalarda (kompyuterdagi ilova,
 * Android WebView) u umuman chiqmasdi va tugma "ishlamas" edi.
 * Endi aniq tanlov: Telegram, nusxa olish, yoki boshqa ilovalar.
 */
export function UlashishOynasi({
  yop,
  matn,
  havola,
}: {
  yop: () => void
  matn?: string
  havola?: string
}) {
  const t = useT()
  const { korsat } = useToast()
  const { data: kod } = useMeningTaklifKodim()
  const manzil = havola ?? (kod ? shaxsiyHavola(kod) : ILOVA_HAVOLASI)
  const yozuv = matn ?? t('tk.taklifMatni')
  const tizimUlashishi = typeof navigator !== 'undefined' && Boolean(navigator.share)

  async function nusxala() {
    try {
      await navigator.clipboard.writeText(`${yozuv}\n${manzil}`)
      korsat({ matn: t('tk.nusxalandi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: manzil, tone: 'muvaffaqiyat' })
    }
  }

  return (
    <Oyna sarlavha={t('tk.taklifQilish')} yop={yop}>
      <p className="text-base leading-relaxed text-text-muted">{t('tk.taklifIzoh')}</p>

      <div className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm break-all text-text-strong">
        {manzil}
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={() =>
            tashqiOch(
              `https://t.me/share/url?url=${encodeURIComponent(manzil)}&text=${encodeURIComponent(yozuv)}`
            )
          }
          className="flex min-h-touch items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: '#229ED9' }}
        >
          <Send className="size-5" aria-hidden />
          {t('tk.telegramdaYuborish')}
        </button>
        <button
          type="button"
          onClick={nusxala}
          className="flex min-h-touch items-center justify-center gap-2 rounded-xl border border-border-control px-5 text-base font-semibold text-text-strong transition hover:bg-surface-muted"
        >
          <Copy className="size-5" aria-hidden />
          {t('tk.havolaniNusxalash')}
        </button>
        {tizimUlashishi && (
          <button
            type="button"
            onClick={() => navigator.share({ text: yozuv, url: manzil }).catch(() => {})}
            className="flex min-h-touch items-center justify-center gap-2 rounded-xl border border-border-control px-5 text-base font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            <Share2 className="size-5" aria-hidden />
            {t('tk.boshqaIlovalar')}
          </button>
        )}
      </div>
    </Oyna>
  )
}
