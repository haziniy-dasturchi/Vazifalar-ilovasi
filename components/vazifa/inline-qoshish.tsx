'use client'

import { useState } from 'react'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { Plus } from 'lucide-react'
import { useVazifaYaratish } from '@/lib/queries/vazifalar'
import { useToast } from '@/components/ui/toast'

/** Bo'lim oxiridagi "+ Vazifa qo'shish" — faqat sarlavha so'raydi */
export function InlineQoshish({
  papkaId,
  bolimId = null,
  otaId = null,
  matn = 'Vazifa qo‘shish',
}: {
  papkaId: string
  bolimId?: string | null
  otaId?: string | null
  matn?: string
}) {
  const [ochiq, setOchiq] = useState(false)
  const [sarlavha, setSarlavha] = useState('')
  const yaratish = useVazifaYaratish()
  const { korsat } = useToast()

  async function qoshish() {
    const tozalangan = sarlavha.trim()
    if (!tozalangan) {
      setOchiq(false)
      return
    }

    setSarlavha('')
    try {
      await yaratish.mutateAsync({
        folder_id: papkaId,
        section_id: bolimId,
        parent_id: otaId,
        title: tozalangan,
      })
    } catch {
      korsat({ matn: 'Qo‘shib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => setOchiq(true)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-faint transition hover:bg-surface-muted hover:text-brand-onsoft"
      >
        <Plus className="size-4" aria-hidden />
        {matn}
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        qoshish()
      }}
      className="rounded-xl bg-surface p-2 shadow-card"
    >
      {/* Uzun nom to'liq ko'rinishi uchun o'suvchi maydon.
          `onBlur` shu yerda emas, o'rab turgan <div> da: maydon
          balandligi o'zgarganda brauzer fokusni qayta hisoblaydi va
          ba'zan blur hodisasi kelib, forma o'z-o'zidan yopilardi. */}
      <div
        onBlur={(e) => {
          if (!sarlavha.trim() && !e.currentTarget.contains(e.relatedTarget)) {
            setOchiq(false)
          }
        }}
      >
        <OsuvchiMaydon
          qiymat={sarlavha}
          onChange={setSarlavha}
          onEnter={qoshish}
          onEscape={() => {
            setSarlavha('')
            setOchiq(false)
          }}
          placeholder="Nima qilish kerak?"
          ariaLabel="Nima qilish kerak?"
          maxLength={500}
          autoFocus
          engKattaBalandlik={160}
          className="min-h-touch bg-transparent px-2 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
        />
      </div>
      <div className="flex justify-end gap-2 px-1 pb-1">
        <button
          type="button"
          onClick={() => {
            setSarlavha('')
            setOchiq(false)
          }}
          className="min-h-0 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-surface-muted"
        >
          Bekor
        </button>
        <button
          type="submit"
          disabled={!sarlavha.trim()}
          className="min-h-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          Qo‘shish
        </button>
      </div>
    </form>
  )
}
