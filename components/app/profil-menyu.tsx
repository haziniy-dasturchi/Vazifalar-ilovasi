'use client'

import { useState } from 'react'
import { Archive, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useFoydalanuvchi } from './foydalanuvchi'
import { useChiqish } from './use-chiqish'
import { useT } from './til-provayder'
import { useProfil } from '@/lib/queries/profil'
import { useOrqagaYopish } from '@/lib/orqaga'

export function ProfilMenyu() {
  const foydalanuvchi = useFoydalanuvchi()
  const { data: profil } = useProfil()
  const chiqish = useChiqish()
  const t = useT()
  const [ochiq, setOchiq] = useState(false)
  useOrqagaYopish(ochiq, () => setOchiq(false))

  // Foydalanuvchi o'zi qo'ygan ism va rasm ustun turadi
  const ism = profil?.full_name?.trim() || foydalanuvchi.ism
  const rasm = profil?.avatar_url ?? foydalanuvchi.rasm
  const bosh = ism.trim().charAt(0).toUpperCase() || 'S'

  return (
    <div className="relative border-t border-border-subtle p-3">
      {ochiq && (
        <>
          <button
            type="button"
            aria-label={t('umumiy.yopish')}
            onClick={() => setOchiq(false)}
            className="fixed inset-0 z-10 min-h-0 cursor-default"
          />
          <div className="absolute bottom-full left-3 z-20 mb-2 w-60 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1 shadow-float">
            <Link
              href="/sozlamalar"
              onClick={() => setOchiq(false)}
              className="flex min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
            >
              <Settings className="size-4" aria-hidden />
              {t('nav.sozlamalar')}
            </Link>
            <Link
              href="/arxiv"
              onClick={() => setOchiq(false)}
              className="flex min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
            >
              <Archive className="size-4" aria-hidden />
              {t('nav.arxiv')}
            </Link>
            <button
              type="button"
              onClick={chiqish}
              className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-danger transition hover:bg-danger-soft"
            >
              <LogOut className="size-4" aria-hidden />
              {t('nav.chiqish')}
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOchiq((v) => !v)}
        aria-expanded={ochiq}
        className="flex w-full items-center gap-3 rounded-xl px-2 text-left transition hover:bg-surface-muted"
      >
        {rasm ? (
          // Avatar Google'dan yoki Supabase storage'dan keladi
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rasm}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
            {bosh}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text-strong">
            {ism}
          </span>
          <span className="block truncate text-xs text-text-faint">
            {foydalanuvchi.email}
          </span>
        </span>
      </button>
    </div>
  )
}
