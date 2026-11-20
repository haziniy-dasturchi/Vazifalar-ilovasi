'use client'

import { useRef, useState } from 'react'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import type { Belgi } from '@/lib/kalit-sozlar'

/**
 * Vazifa nomi maydoni — tanilgan kalit so'zlar rang bilan
 * belgilanadi (Todoist'dagidek).
 *
 * --- Qanday ishlaydi ---
 * `<textarea>` ichidagi matnning bir qismini bo'yash mumkin emas.
 * Shuning uchun maydon ORQASIGA aynan shu matn yana bir marta
 * chiziladi ("ko'zgu"): u ko'rinmas (matn rangi shaffof), lekin
 * kalit so'z turgan joyda rangli fon bor. Ustidagi haqiqiy matn
 * esa `<textarea>` niki.
 *
 * MUHIM: `<textarea>` ALMASHTIRILMAYDI — u o'z joyida qoladi va
 * fokusni yo'qotmaydi. Telefonda klaviatura har harfdan keyin
 * yopilib qolmasligi uchun bu shart (oldin shunday xato bo'lgan).
 * Ko'zgu faqat orqa fon, u hodisalarni ham qabul qilmaydi.
 *
 * Ikkala qatlam BIR XIL tipografiyaga ega bo'lishi shart, aks
 * holda bo'yoq matndan siljib ketadi.
 */
export function KalitMaydon({
  qiymat,
  belgilar,
  onChange,
  onEnter,
  onEscape,
  onBekor,
  placeholder,
  ariaLabel,
  maxLength,
  autoFocus,
  engKattaBalandlik,
  className = '',
}: {
  qiymat: string
  belgilar: Belgi[]
  onChange: (q: string) => void
  onEnter?: () => void
  onEscape?: () => void
  /** Belgini bekor qilish — matni bilan */
  onBekor: (matn: string) => void
  placeholder?: string
  ariaLabel?: string
  maxLength?: number
  autoFocus?: boolean
  engKattaBalandlik?: number
  className?: string
}) {
  const maydonRef = useRef<HTMLTextAreaElement | null>(null)
  const kozguRef = useRef<HTMLDivElement>(null)
  const [surilish, setSurilish] = useState(0)

  /** Kursor shu belgining ichidami */
  function belgiTop(kursor: number, oxiridami = false): Belgi | undefined {
    return belgilar.find((b) =>
      oxiridami ? kursor === b.oxiri : kursor > b.boshi && kursor <= b.oxiri
    )
  }

  return (
    <div className="relative">
      {/*
        Ko'zgu. `aria-hidden`: ekran o'qigich matnni ikki marta
        o'qimasligi kerak. `pointer-events-none`: bosish doim
        ostidagi maydonga tushadi.
      */}
      <div
        ref={kozguRef}
        aria-hidden
        style={{ transform: `translateY(-${surilish}px)` }}
        className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-transparent select-none ${className}`}
      >
        {bolaklar(qiymat, belgilar).map((b, i) =>
          b.belgi ? (
            <mark
              key={i}
              className="rounded bg-brand-soft text-transparent"
            >
              {b.matn}
            </mark>
          ) : (
            <span key={i}>{b.matn}</span>
          )
        )}
        {/* Oxiridagi yangi qator ko'rinishi uchun */}
        {qiymat.endsWith('\n') && <span>&nbsp;</span>}
      </div>

      <OsuvchiMaydon
        qiymat={qiymat}
        onChange={onChange}
        onEnter={onEnter}
        onEscape={onEscape}
        maydonRef={maydonRef}
        onSurilish={setSurilish}
        onBosish={(kursor) => {
          const b = belgiTop(kursor)
          if (b) onBekor(b.matn)
        }}
        onOchirish={(kursor) => {
          // Kursor aynan belgining oxirida bo'lsa, birinchi Backspace
          // belgini bekor qiladi — harf o'chmaydi
          const b = belgiTop(kursor, true)
          if (!b) return false
          onBekor(b.matn)
          return true
        }}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        maxLength={maxLength}
        autoFocus={autoFocus}
        engKattaBalandlik={engKattaBalandlik}
        className={`relative bg-transparent ${className}`}
      />
    </div>
  )
}

type Bolak = { matn: string; belgi: boolean }

/** Matnni belgilangan va oddiy bo'laklarga ajratadi */
function bolaklar(matn: string, belgilar: Belgi[]): Bolak[] {
  const tartib = [...belgilar].sort((a, b) => a.boshi - b.boshi)
  const natija: Bolak[] = []
  let oxirgi = 0

  for (const b of tartib) {
    if (b.boshi > oxirgi) {
      natija.push({ matn: matn.slice(oxirgi, b.boshi), belgi: false })
    }
    natija.push({ matn: matn.slice(b.boshi, b.oxiri), belgi: true })
    oxirgi = b.oxiri
  }

  if (oxirgi < matn.length) {
    natija.push({ matn: matn.slice(oxirgi), belgi: false })
  }
  return natija
}
