'use client'

import { AlignLeft } from 'lucide-react'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { useT } from '@/components/app/til-provayder'

/**
 * Vazifa izohi — nom ostidagi kichik, xira maydon (Todoist'dagidek).
 *
 * Nega alohida komponent: u uch joyda ishlatiladi (vazifa oynasi,
 * tezkor qo'shish va kelajakda subtask), ko'rinishi va klaviatura
 * qoidalari esa hamma joyda bir xil bo'lishi kerak.
 *
 * Klaviatura: Enter — vazifani saqlaydi (nom maydoni bilan bir xil),
 * Shift+Enter — yangi qator. Shunda odam kursor qayerdaligini
 * o'ylab o'tirmaydi.
 *
 * MUHIM: kalit so'z parseri (tezkor kiritish) bu maydonga
 * TEGMAYDI — izohdagi "ertaga soat 9 da uchrashuv" matni vazifa
 * sanasini o'zgartirib yubormasligi kerak.
 */
export function IzohMaydoni({
  qiymat,
  onChange,
  onEnter,
  onEscape,
}: {
  qiymat: string
  onChange: (q: string) => void
  onEnter?: () => void
  onEscape?: () => void
}) {
  const t = useT()

  return (
    <div className="flex items-start gap-2">
      <AlignLeft
        className="mt-2.5 size-3.5 shrink-0 text-text-faint"
        aria-hidden
      />
      <OsuvchiMaydon
        qiymat={qiymat}
        onChange={onChange}
        onEnter={onEnter}
        onEscape={onEscape}
        kopQatorli
        placeholder={t('vazifa.izoh')}
        ariaLabel={t('vazifa.izoh')}
        maxLength={5000}
        engKattaBalandlik={180}
        className="bg-transparent px-0 py-1.5 text-sm leading-relaxed text-text-muted outline-none placeholder:text-text-faint"
      />
    </div>
  )
}
