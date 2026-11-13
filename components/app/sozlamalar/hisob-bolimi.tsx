'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { HisobOchirish } from '@/components/app/hisob-ochirish'
import { useSupabase } from '@/lib/supabase/use-supabase'
import {
  AVATAR_ENG_KATTA_BAYT,
  AVATAR_TURLARI,
  avatarniOchir,
  avatarniYukla,
  useProfil,
  useProfilYangilash,
} from '@/lib/queries/profil'

export function HisobBolimi() {
  const foydalanuvchi = useFoydalanuvchi()
  const { data: profil } = useProfil()
  const yangilash = useProfilYangilash()
  const supabase = useSupabase()
  const { korsat } = useToast()

  const faylRef = useRef<HTMLInputElement>(null)
  const [yuklanmoqda, setYuklanmoqda] = useState(false)
  const [ism, setIsm] = useState(profil?.full_name ?? foydalanuvchi.ism)

  // Profil rasmi: avval o'zi yuklagani, bo'lmasa Google'dan kelgani
  const rasm = profil?.avatar_url ?? foydalanuvchi.rasm
  const bosh = (profil?.full_name ?? foydalanuvchi.ism).trim().charAt(0).toUpperCase() || 'S'
  const ismOzgardi = ism.trim() !== (profil?.full_name ?? foydalanuvchi.ism).trim()

  async function faylTanlandi(e: React.ChangeEvent<HTMLInputElement>) {
    const fayl = e.target.files?.[0]
    // Bir xil faylni qayta tanlash ham hodisa chiqarishi uchun tozalaymiz
    e.target.value = ''
    if (!fayl) return

    if (!AVATAR_TURLARI.includes(fayl.type)) {
      korsat({ matn: 'Faqat JPG, PNG yoki WebP rasm yuklash mumkin', tone: 'xato' })
      return
    }
    if (fayl.size > AVATAR_ENG_KATTA_BAYT) {
      korsat({ matn: 'Rasm 2 MB dan katta bo‘lmasin', tone: 'xato' })
      return
    }

    setYuklanmoqda(true)
    try {
      const havola = await avatarniYukla(
        supabase,
        foydalanuvchi.id,
        fayl,
        profil?.avatar_url
      )
      await yangilash.mutateAsync({ avatar_url: havola })
      korsat({ matn: 'Profil rasmi yangilandi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({
        matn: 'Rasmni yuklab bo‘lmadi. Internetni tekshirib, qayta urining.',
        tone: 'xato',
      })
    } finally {
      setYuklanmoqda(false)
    }
  }

  async function rasmniOlibTashla() {
    const eski = profil?.avatar_url ?? null
    try {
      await yangilash.mutateAsync({ avatar_url: null })
      // Fayl ham o'chadi — profilda havola qolmagach u keraksiz
      await avatarniOchir(supabase, foydalanuvchi.id, eski)
      korsat({ matn: 'Profil rasmi olib tashlandi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  async function ismniSaqla() {
    const tozalangan = ism.trim()
    if (!tozalangan) {
      korsat({ matn: 'Ism bo‘sh bo‘lmasin', tone: 'xato' })
      return
    }
    try {
      await yangilash.mutateAsync({ full_name: tozalangan })
      korsat({ matn: 'Ism saqlandi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <div className="space-y-4">
      <SozlamaKartasi
        sarlavha="Profil rasmi"
        tavsif="JPG, PNG yoki WebP. Eng katta hajm — 2 MB."
      >
        <div className="flex items-center gap-4">
          {rasm ? (
            // Rasm Supabase storage'dan yoki Google'dan keladi —
            // next/image uchun ikkala domen ham sozlanishi kerak bo'lardi
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rasm}
              alt=""
              width={72}
              height={72}
              className="size-18 shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-18 shrink-0 items-center justify-center rounded-full bg-brand-primary text-2xl font-semibold text-white">
              {bosh}
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={faylRef}
              type="file"
              accept={AVATAR_TURLARI.join(',')}
              onChange={faylTanlandi}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => faylRef.current?.click()}
              disabled={yuklanmoqda}
              className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {yuklanmoqda ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-4" aria-hidden />
              )}
              {yuklanmoqda ? 'Yuklanmoqda…' : 'Rasm yuklash'}
            </button>

            {profil?.avatar_url && (
              <button
                type="button"
                onClick={rasmniOlibTashla}
                disabled={yangilash.isPending}
                className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden />
                Olib tashlash
              </button>
            )}
          </div>
        </div>
      </SozlamaKartasi>

      <SozlamaKartasi sarlavha="Ism">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={ism}
            onChange={(e) => setIsm(e.target.value)}
            maxLength={80}
            aria-label="Ism"
            className="min-h-touch min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-4 text-base text-text-strong outline-none focus:border-brand-onsoft"
          />
          <button
            type="button"
            onClick={ismniSaqla}
            disabled={!ismOzgardi || yangilash.isPending}
            className="min-h-touch shrink-0 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
          >
            Saqlash
          </button>
        </div>
      </SozlamaKartasi>

      <SozlamaKartasi
        sarlavha="Email"
        tavsif={`${foydalanuvchi.email} — Google hisobiga bog‘langan, shu yerdan o‘zgartirib bo‘lmaydi.`}
      />

      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <HuquqiyHavola href="/maxfiylik" matn="Maxfiylik siyosati" />
        <HuquqiyHavola href="/shartlar" matn="Foydalanish shartlari" />
      </div>

      <HisobOchirish />
    </div>
  )
}

function HuquqiyHavola({ href, matn }: { href: string; matn: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center justify-between border-b border-border-subtle px-4 py-3 text-base text-text-strong transition last:border-0 hover:bg-surface-muted"
    >
      {matn}
      <ChevronRight className="size-4 text-text-faint" aria-hidden />
    </Link>
  )
}
