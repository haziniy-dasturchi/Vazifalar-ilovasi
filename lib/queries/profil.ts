'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { kalit } from './keys'
import { MUTATSIYA, type ProfilOzgarishi } from './mutatsiya-sozlamalari'
import type { Foydalanuvchi } from '@/components/app/foydalanuvchi'
import type { Profile } from '@/types/vazifalar'

/** Avatar rasmlari shu bucket'da (migratsiya: 20261113090000) */
export const AVATAR_BUCKET = 'avatarlar'
/** Bucket'dagi cheklov bilan bir xil bo'lishi shart */
export const AVATAR_ENG_KATTA_BAYT = 2 * 1024 * 1024
export const AVATAR_TURLARI = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Foydalanuvchi ma'lumotini (ism, email, rasm) mijoz tomonda, tarmoqsiz
 * o'qiydi — sessiya allaqachon brauzerda saqlangan, middleware esa har bir
 * so'rovda xavfsizlik tekshiruvini alohida bajaradi. Shu sababli bu yerda
 * qayta tasdiqlash shart emas, faqat ko'rsatish uchun.
 */
export function useFoydalanuvchiSorovi() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.profil,
    queryFn: async (): Promise<Foydalanuvchi> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user
      if (!user) throw new Error('Sessiya topilmadi')

      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
      return {
        id: user.id,
        email: user.email ?? '',
        ism:
          meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Foydalanuvchi',
        rasm: meta.avatar_url ?? null,
      }
    },
    staleTime: Infinity,
    retry: false,
  })
}

/**
 * `profiles` jadvalidagi sozlamalar qatori.
 *
 * Sessiyadagi ma'lumotdan farqi: bu yerdagi ism va rasm foydalanuvchi
 * O'ZI kiritgan qiymatlar. Google'dan kelgan qiymat faqat boshlang'ich
 * nuqta — uni almashtirish mumkin bo'lishi kerak.
 */
export function useProfil() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.sozlamalar,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}

export function useProfilYangilash() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATSIYA.profilYangilash,

    // Sozlamalar darhol ko'rinishi kerak — tugmani bosgan odam
    // javobni kutib o'tirmasin. Xato bo'lsa eski holat qaytariladi.
    onMutate: async (ozgarish: ProfilOzgarishi) => {
      await qc.cancelQueries({ queryKey: kalit.sozlamalar })
      const eski = qc.getQueryData<Profile>(kalit.sozlamalar)
      if (eski) {
        qc.setQueryData<Profile>(kalit.sozlamalar, { ...eski, ...ozgarish })
      }
      return { eski }
    },

    onError: (_xato, _ozgarish, context) => {
      if (context?.eski) qc.setQueryData(kalit.sozlamalar, context.eski)
    },

    onSettled: () => qc.invalidateQueries({ queryKey: kalit.sozlamalar }),
  })
}

/**
 * Avatarni yuklaydi va ommaviy havolasini qaytaradi.
 *
 * Fayl nomiga vaqt belgisi qo'shiladi: bir xil nom bilan qayta
 * yuklansa, brauzer eski rasmni keshdan ko'rsatib turardi va
 * foydalanuvchi "o'zgarmadi" deb o'ylardi.
 */
export async function avatarniYukla(
  supabase: ReturnType<typeof useSupabase>,
  foydalanuvchiId: string,
  fayl: File
): Promise<string> {
  const kengaytma = fayl.type === 'image/png' ? 'png' : fayl.type === 'image/webp' ? 'webp' : 'jpg'
  const yol = `${foydalanuvchiId}/avatar-${Date.now()}.${kengaytma}`

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(yol, fayl, { contentType: fayl.type, upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(yol)
  return data.publicUrl
}
