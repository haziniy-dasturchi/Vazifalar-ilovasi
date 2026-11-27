'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, Share2, X } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import type { TopshiriqKontakti } from '@/lib/queries/topshiriqlar'
import { Avatar } from './karta'

const EMAIL_SHAKLI = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * "Kimga" — ochiluvchi ro'yxat (qidiruv bilan).
 *
 * Oldin hamma kontaktlar formaning o'zida qator bo'lib turardi — 50
 * kishi bo'lsa forma ro'yxatga aylanib qolardi. Endi yopiq holatda
 * faqat tanlanganlar (kichik nishonlar) ko'rinadi; bosilsa — qidiruvli
 * ro'yxat. Ro'yxatda yo'q odamni qidiruvga emailini yozib qo'shish mumkin.
 */
export function KimgaTanlagich({
  kontaktlar,
  tanlanganlar,
  ozgartir,
  taklifQil,
}: {
  kontaktlar: TopshiriqKontakti[]
  tanlanganlar: string[]
  ozgartir: (yangi: string[]) => void
  taklifQil: () => void
}) {
  const t = useT()
  const { email: ozEmail } = useFoydalanuvchi()
  const [ochiq, setOchiq] = useState(false)
  const [qidiruv, setQidiruv] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const ismi = useMemo(() => new Map(kontaktlar.map((k) => [k.email, k.ism])), [kontaktlar])
  const q = qidiruv.trim().toLowerCase()
  const mos = kontaktlar.filter(
    (k) => !q || k.email.includes(q) || (k.ism ?? '').toLowerCase().includes(q)
  )
  const yangiEmail =
    EMAIL_SHAKLI.test(q) && q !== ozEmail.toLowerCase() && !kontaktlar.some((k) => k.email === q)
      ? q
      : null

  function almashtir(e: string) {
    ozgartir(tanlanganlar.includes(e) ? tanlanganlar.filter((x) => x !== e) : [...tanlanganlar, e])
  }

  return (
    <div>
      {/* Yopiq holat: tanlanganlar va ochish tugmasi */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={ochiq}
        onClick={() => {
          setOchiq((v) => !v)
          window.setTimeout(() => input.current?.focus(), 50)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOchiq((v) => !v)
          }
        }}
        className={`flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-xl border bg-surface px-2.5 py-1.5 text-left transition ${
          ochiq ? 'border-brand-onsoft' : 'border-border-control hover:border-text-faint'
        }`}
      >
        {tanlanganlar.length === 0 && (
          <span className="px-1 text-sm text-text-faint">{t('tk.odamTanlang')}</span>
        )}
        {tanlanganlar.map((e) => (
          <span
            key={e}
            className="flex max-w-full items-center gap-1.5 rounded-full bg-brand-soft py-0.5 pr-1 pl-0.5 text-sm font-medium text-brand-onsoft"
          >
            <Avatar ism={ismi.get(e) ?? e} kalit={e} />
            <span className="truncate">{ismi.get(e) ?? e}</span>
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation()
                almashtir(e)
              }}
              aria-label={t('umumiy.ochirish')}
              className="flex size-6 min-h-0 items-center justify-center rounded-full hover:bg-surface"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <ChevronDown
          className={`ml-auto size-4 shrink-0 text-text-faint transition ${ochiq ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </div>

      {/* Ochiq holat: qidiruv va ro'yxat */}
      {ochiq && (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-card">
          <div className="flex items-center gap-2 border-b border-border-subtle px-3">
            <Search className="size-4 shrink-0 text-text-faint" aria-hidden />
            <input
              ref={input}
              value={qidiruv}
              onChange={(e) => setQidiruv(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (yangiEmail) {
                    almashtir(yangiEmail)
                    setQidiruv('')
                  }
                }
              }}
              placeholder={t('tk.qidirishJoy')}
              aria-label={t('tk.qidirishJoy')}
              className="min-h-10 w-full bg-transparent text-sm text-text-strong outline-none placeholder:text-text-faint"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {yangiEmail && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    almashtir(yangiEmail)
                    setQidiruv('')
                  }}
                  className="flex w-full min-h-0 items-center gap-2.5 px-3 py-2 text-left text-sm text-brand-onsoft hover:bg-surface-muted"
                >
                  <Plus className="size-4" aria-hidden />
                  {t('tk.emailQoshish', { email: yangiEmail })}
                </button>
              </li>
            )}
            {mos.map((k) => {
              const belgi = tanlanganlar.includes(k.email)
              return (
                <li key={k.email}>
                  <button
                    type="button"
                    onClick={() => almashtir(k.email)}
                    aria-pressed={belgi}
                    className={`flex w-full min-h-0 items-center gap-2.5 px-3 py-2 text-left transition hover:bg-surface-muted ${
                      belgi ? 'bg-brand-soft/60' : ''
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        belgi ? 'border-brand-primary bg-brand-primary text-white' : 'border-border-control'
                      }`}
                      aria-hidden
                    >
                      {belgi && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <Avatar ism={k.ism ?? k.email} kalit={k.email} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-strong">
                        {k.ism ?? k.email}
                      </span>
                      {k.ism && <span className="block truncate text-xs text-text-faint">{k.email}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
            {mos.length === 0 && !yangiEmail && (
              <li className="px-3 py-3 text-sm text-text-faint">
                {kontaktlar.length === 0 ? t('tk.kontaktYoq') : t('tk.topilmadiQidiruv')}
              </li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-2">
            <span className="text-xs text-text-muted">
              {tanlanganlar.length > 0 ? t('tk.tanlandiSoni', { son: tanlanganlar.length }) : ''}
            </span>
            <button
              type="button"
              onClick={() => setOchiq(false)}
              className="min-h-0 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
            >
              {t('tk.tayyor')}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={taklifQil}
        className="mt-2 flex min-h-0 flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg px-1 py-1 text-left text-sm text-text-muted transition hover:text-brand-onsoft"
      >
        {t('tk.royxatdaYoqmi')}
        <span className="flex items-center gap-1 font-semibold whitespace-nowrap text-brand-onsoft">
          <Share2 className="size-4" aria-hidden />
          {t('tk.taklifQiling')}
        </span>
      </button>
    </div>
  )
}
