'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, Yuklanmoqda } from '@/components/ui/holatlar'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { usePapkaOchirish, usePapkaYangilash, usePapkalar } from '@/lib/queries/papkalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import type { Folder } from '@/types/vazifalar'

export function ArxivKorinishi() {
  const { data, isPending } = usePapkalar()
  const yangilash = usePapkaYangilash()
  const ochirish = usePapkaOchirish()
  const { korsat } = useToast()
  const [ochiriladigan, setOchiriladigan] = useState<Folder | null>(null)

  const arxiv = data?.filter((p) => p.is_archived) ?? []

  async function qaytar(papka: Folder) {
    try {
      await yangilash.mutateAsync({ id: papka.id, is_archived: false })
      korsat({ matn: 'Papka qaytarildi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: 'Qaytarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <Sahifa
      sarlavha="Arxiv"
      tavsif="Arxivlangan papkalar ro‘yxatdan yashiriladi, lekin vazifalari saqlanadi"
    >
      {isPending ? (
        <Yuklanmoqda qator={2} />
      ) : arxiv.length === 0 ? (
        <BoshHolat
          ikonka={Archive}
          sarlavha="Arxiv bo‘sh"
          matn="Papkani arxivlash uchun uning menyusidan “Arxivlash” ni tanlang."
        />
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
          {arxiv.map((papka) => {
            const Ikonka = papkaIkonkasi(papka.icon)
            return (
              <li
                key={papka.id}
                className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-0"
              >
                <Ikonka
                  className="size-5 shrink-0"
                  style={{ color: papka.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-base text-text-strong">
                  {papka.name}
                </span>

                <button
                  type="button"
                  onClick={() => qaytar(papka)}
                  aria-label="Qaytarish"
                  className="flex size-11 min-h-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-muted hover:text-brand-primary"
                >
                  <ArchiveRestore className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setOchiriladigan(papka)}
                  aria-label="O‘chirish"
                  className="flex size-11 min-h-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {ochiriladigan && (
        <Tasdiq
          sarlavha="Papkani o‘chirish"
          matn={`"${ochiriladigan.name}" papkasi va undagi barcha vazifalar butunlay o‘chadi. Buni qaytarib bo‘lmaydi.`}
          tasdiqla={async () => {
            try {
              await ochirish.mutateAsync(ochiriladigan.id)
              setOchiriladigan(null)
              korsat({ matn: 'Papka o‘chirildi', tone: 'muvaffaqiyat' })
            } catch {
              korsat({
                matn: 'O‘chirib bo‘lmadi. Qayta urinib ko‘ring.',
                tone: 'xato',
              })
            }
          }}
          yop={() => setOchiriladigan(null)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </Sahifa>
  )
}
