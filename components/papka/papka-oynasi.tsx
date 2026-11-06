'use client'

import { useState } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { useToast } from '@/components/ui/toast'
import { usePapkaYangilash, usePapkaYaratish } from '@/lib/queries/papkalar'
import {
  IKONKA_RUYXATI,
  PAPKA_IKONKALARI,
  PAPKA_RANGLARI,
  SHABLON_PAPKALAR,
  papkaIkonkasi,
} from '@/lib/papka-stillari'
import type { Folder } from '@/types/vazifalar'

export function PapkaOynasi({
  papka,
  yop,
}: {
  papka?: Folder
  yop: () => void
}) {
  const tahrir = Boolean(papka)
  const router = useRouter()
  const { korsat } = useToast()
  const yaratish = usePapkaYaratish()
  const yangilash = usePapkaYangilash()

  const [nom, setNom] = useState(papka?.name ?? '')
  const [rang, setRang] = useState(papka?.color ?? PAPKA_RANGLARI[2].hex)
  const [ikonka, setIkonka] = useState(papka?.icon ?? 'papka')

  const bajarilmoqda = yaratish.isPending || yangilash.isPending
  const nomToliq = nom.trim().length > 0

  /**
   * Offline'da ham ishlashi uchun natijani KUTMAYMIZ: o'zgarish
   * keshda darhol ko'rinadi, serverga yuborish esa navbatga tushadi
   * va aloqa tiklanganda o'zi bajariladi. Aks holda internet yo'q
   * paytda tugma cheksiz "saqlanmoqda" bo'lib qolardi.
   */
  async function saqla() {
    if (!nomToliq || bajarilmoqda) return

    const maydonlar = { name: nom.trim(), color: rang, icon: ikonka }

    if (papka) {
      yangilash.mutate({ id: papka.id, ...maydonlar })
      korsat({ matn: 'Papka yangilandi', tone: 'muvaffaqiyat' })
      yop()
      return
    }

    // Yangi papkaga o'tish uchun uning id'si kerak — bu faqat server
    // javob berganda ma'lum. Onlayn bo'lsa kutamiz, offline bo'lsa
    // shunchaki yopamiz: papka ro'yxatda allaqachon ko'rinib turadi.
    if (onlineManager.isOnline()) {
      try {
        const yangi = await yaratish.mutateAsync(maydonlar)
        korsat({ matn: 'Papka yaratildi', tone: 'muvaffaqiyat' })
        yop()
        router.push(`/papka/${yangi.id}`)
      } catch {
        korsat({ matn: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
      }
      return
    }

    yaratish.mutate(maydonlar)
    korsat({ matn: 'Papka yaratildi', tone: 'muvaffaqiyat' })
    yop()
  }

  const Oldindan = papkaIkonkasi(ikonka)

  return (
    <Oyna sarlavha={tahrir ? 'Papkani tahrirlash' : 'Yangi papka'} yop={yop}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saqla()
        }}
      >
        {/* Tayyor nomlar — faqat yangi papka uchun */}
        {!tahrir && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-text-muted">
              Tayyor nomlar
            </p>
            <div className="flex flex-wrap gap-2">
              {SHABLON_PAPKALAR.map((shablon) => (
                <button
                  key={shablon.name}
                  type="button"
                  onClick={() => {
                    setNom(shablon.name)
                    setIkonka(shablon.icon)
                    setRang(shablon.color)
                  }}
                  className="min-h-0 rounded-full border border-border-subtle px-4 py-2 text-sm text-text-strong transition hover:border-brand-primary hover:bg-brand-soft"
                >
                  {shablon.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-text-muted">
            Papka nomi
          </span>
          <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 focus-within:border-brand-primary">
            <Oldindan
              className="size-5 shrink-0"
              style={{ color: rang }}
              aria-hidden
            />
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Masalan: Ish"
              maxLength={120}
              autoFocus
              className="min-h-touch flex-1 bg-transparent py-3 text-base text-text-strong outline-none placeholder:text-text-faint"
            />
          </div>
        </label>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-text-muted">
            Rang
          </legend>
          <div className="flex flex-wrap gap-2">
            {PAPKA_RANGLARI.map((r) => (
              <button
                key={r.hex}
                type="button"
                onClick={() => setRang(r.hex)}
                aria-label={r.nom}
                aria-pressed={rang === r.hex}
                className="flex size-11 min-h-0 items-center justify-center rounded-full transition"
                style={{ backgroundColor: r.hex }}
              >
                {rang === r.hex && (
                  <Check className="size-5 text-white" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-text-muted">
            Belgi
          </legend>
          <div className="grid grid-cols-7 gap-2">
            {IKONKA_RUYXATI.filter((n) => n !== 'inbox').map((nomi) => {
              const Ikonka = PAPKA_IKONKALARI[nomi]
              const tanlangan = ikonka === nomi
              return (
                <button
                  key={nomi}
                  type="button"
                  onClick={() => setIkonka(nomi)}
                  aria-pressed={tanlangan}
                  className={`flex size-11 min-h-0 items-center justify-center rounded-xl border transition ${
                    tanlangan
                      ? 'border-brand-primary bg-brand-soft'
                      : 'border-border-subtle hover:bg-surface-muted'
                  }`}
                >
                  <Ikonka
                    className="size-5"
                    style={{ color: tanlangan ? rang : undefined }}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!nomToliq || bajarilmoqda}
          className="mt-7 w-full rounded-xl bg-brand-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {bajarilmoqda ? 'Saqlanmoqda…' : tahrir ? 'Saqlash' : 'Papka yaratish'}
        </button>
      </form>
    </Oyna>
  )
}
