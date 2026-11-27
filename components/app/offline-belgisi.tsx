'use client'

import { useEffect, useRef, useState } from 'react'
import {
  onlineManager,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query'
import { CircleCheck, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { ilovaNativemi } from '@/lib/platform'

/**
 * Yuqoridagi ingichka holat chizig'i.
 *
 * Platformaga qarab MA'NOSI boshqacha:
 *   - Appda: o'zgarishlar internetsiz ham navbatga (outbox) tushadi —
 *     shuning uchun "ishlashda davom eting, saqlanmoqda" deyiladi.
 *   - Veb'da: offline paytda tahrirlash bloklangan (`useOutboxMutation`),
 *     shuning uchun bu yerda faqat "faqat ko'rish" ekanini aytamiz —
 *     "o'zgarish kutmoqda" degan gap veb'da HECH QACHON chiqmaydi,
 *     chunki navbatga hech narsa tushmaydi.
 *
 * Ikkisida ham: texnik xato matni (server javobi) foydalanuvchiga
 * KO'RSATILMAYDI — faqat console'ga yoziladi. Ekranda faqat umumiy,
 * do'stona xabar turadi.
 */
export function OfflineBelgisi() {
  const t = useT()
  const qc = useQueryClient()
  const [onlayn, setOnlayn] = useState(true)
  const [sinxronlandiKorsat, setSinxronlandiKorsat] = useState(false)

  useEffect(() => {
    setOnlayn(onlineManager.isOnline())
    return onlineManager.subscribe((holat) => setOnlayn(holat))
  }, [])

  // Internet yo'qligi sababli to'xtab turgan yozuvlar (faqat appda bo'ladi)
  const kutayotgan = useMutationState({
    filters: { predicate: (m) => m.state.isPaused },
  }).length

  // Server rad etgan yozuvlar — o'zi qayta urinmaydi, lekin yo'qolmaydi
  const xatoXabarlari = useMutationState({
    filters: { status: 'error' },
    // Qaysi yozuv (mutatsiya kaliti) va server nima dedi — "Batafsil"
    // ochilganda ko'rinadi. Foydalanuvchi skrinshot yuborsa, sabab
    // darhol aniq bo'ladi, konsol ochish shart bo'lmaydi.
    select: (m) => {
      const qayer = (m.options.mutationKey ?? []).slice(1).join('.') || 'mutatsiya'
      const xato = m.state.error as { message?: string; code?: string } | null
      return `${qayer}: ${xato?.message ?? '?'}${xato?.code ? ` (${xato.code})` : ''}`
    },
  })
  const [batafsil, setBatafsil] = useState(false)
  const xatolar = xatoXabarlari.length

  // Haqiqiy xato matni faqat konsolga — foydalanuvchi texnik tilni
  // o'qishi shart emas, lekin dastur ustida ishlayotgan odam ko'rishi kerak
  useEffect(() => {
    if (xatoXabarlari.length > 0) console.error('[offline]', xatoXabarlari)
  }, [xatoXabarlari])

  // "Sinxronlandi" belgisi: navbat N>0 dan 0 ga TUSHGAN zahoti 2.5
  // soniya ko'rinib, o'zi yo'qoladi. Oldingi qiymatni o'zimiz
  // kuzatamiz — aks holda sahifa ochilganda (navbat boshidanoq 0
  // bo'lsa) ham bu belgi behuda chiqib ketardi.
  const oldingiKutayotgan = useRef(kutayotgan)
  useEffect(() => {
    if (onlayn && oldingiKutayotgan.current > 0 && kutayotgan === 0) {
      setSinxronlandiKorsat(true)
      const vaqt = window.setTimeout(() => setSinxronlandiKorsat(false), 2500)
      oldingiKutayotgan.current = kutayotgan
      return () => window.clearTimeout(vaqt)
    }
    oldingiKutayotgan.current = kutayotgan
  }, [onlayn, kutayotgan])

  function qaytaUrin() {
    const mutatsiyalar = qc
      .getMutationCache()
      .getAll()
      .filter((m) => m.state.status === 'error')
    for (const m of mutatsiyalar) {
      m.execute(m.state.variables).catch((xato) => console.error('[offline]', xato))
    }
  }

  if (onlayn && kutayotgan === 0 && xatolar === 0 && !sinxronlandiKorsat) {
    return null
  }

  return (
    // Appda holat paneli (soat, batareya) WebView ustida turadi —
    // yozuv uning ostiga kirib, o'qib bo'lmay qolardi
    <div className="sticky top-0 z-50 bg-surface pt-[env(safe-area-inset-top)]">
      {!onlayn && (
        <Chiziq ikonka={CloudOff}>
          {ilovaNativemi()
            ? t('offline.yoq')
            : t('offline.faqatKorish')}
          {ilovaNativemi() && kutayotgan > 0 && ` · ${t('offline.kutmoqda', { n: kutayotgan })}`}
        </Chiziq>
      )}

      {onlayn && kutayotgan > 0 && (
        <Chiziq ikonka={RefreshCw} aylanmoqda>
          {t('offline.yuborilmoqda', { n: kutayotgan })}
        </Chiziq>
      )}

      {onlayn && kutayotgan === 0 && xatolar === 0 && sinxronlandiKorsat && (
        <Chiziq ikonka={CircleCheck}>{t('offline.sinxronlandi')}</Chiziq>
      )}

      {xatolar > 0 && (
        <Chiziq ikonka={TriangleAlert} xato>
          {t('offline.xato', { n: xatolar })}
          <button
            type="button"
            onClick={qaytaUrin}
            className="ml-2 shrink-0 underline underline-offset-2"
          >
            {t('offline.qaytaUrinish')}
          </button>
          <button
            type="button"
            onClick={() => setBatafsil((b) => !b)}
            aria-expanded={batafsil}
            className="ml-2 shrink-0 underline underline-offset-2 opacity-80"
          >
            {t('offline.batafsil')}
          </button>
        </Chiziq>
      )}
      {xatolar > 0 && batafsil && (
        <pre className="max-h-40 overflow-auto border-b border-danger/20 bg-danger-soft px-4 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-danger select-text">
          {xatoXabarlari.join('\n')}
        </pre>
      )}
    </div>
  )
}

function Chiziq({
  ikonka: Ikonka,
  xato = false,
  aylanmoqda = false,
  children,
}: {
  ikonka: typeof CloudOff
  xato?: boolean
  aylanmoqda?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 border-b px-4 py-1.5 text-xs font-medium ${
        xato
          ? 'border-danger/20 bg-danger-soft text-danger'
          : 'border-border-subtle bg-surface-sunken text-text-muted'
      }`}
    >
      <Ikonka className={`size-3.5 shrink-0 ${aylanmoqda ? 'animate-spin' : ''}`} aria-hidden />
      {/* Xato to'liq o'qilishi va "Batafsil" tugmasi telefonda ham
          ko'rinishi uchun qatorga sig'masa ko'chadi */}
      <span className={xato ? 'flex flex-wrap items-center justify-center gap-y-1 text-center' : 'truncate'}>
        {children}
      </span>
    </div>
  )
}
