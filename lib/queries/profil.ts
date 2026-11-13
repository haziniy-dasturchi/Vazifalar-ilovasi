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
 * Ommaviy havoladan storage ichidagi yo'lni ajratib oladi.
 * Faqat shu bucket'ga va shu foydalanuvchiga tegishli bo'lsa qaytaradi —
 * aks holda `null`, ya'ni begona faylga hech qachon tegmaymiz.
 */
function avatarYoli(havola: string | null, foydalanuvchiId: string): string | null {
  if (!havola) return null
  const belgi = `/storage/v1/object/public/${AVATAR_BUCKET}/`
  const i = havola.indexOf(belgi)
  if (i === -1) return null
  const yol = havola.slice(i + belgi.length).split('?')[0]
  return yol.startsWith(`${foydalanuvchiId}/`) ? yol : null
}

/**
 * Avatarni yuklaydi va ommaviy havolasini qaytaradi.
 *
 * Fayl nomiga vaqt belgisi qo'shiladi: bir xil nom bilan qayta
 * yuklansa, brauzer eski rasmni keshdan ko'rsatib turardi va
 * foydalanuvchi "o'zgarmadi" deb o'ylardi.
 *
 * Yangisi muvaffaqiyatli yuklangach eskisi o'chiriladi. Aks holda har
 * bir almashtirish storage'da yana bitta fayl qoldirib ketardi va
 * bepul tarif chegarasi asta-sekin to'lib borardi. Tartib muhim:
 * avval yuklash, keyin o'chirish — teskarisi bo'lsa, yuklash xato
 * bersa foydalanuvchi rasmsiz qolardi.
 */
export async function avatarniYukla(
  supabase: ReturnType<typeof useSupabase>,
  foydalanuvchiId: string,
  fayl: File,
  eskiHavola?: string | null
): Promise<string> {
  const kengaytma =
    fayl.type === 'image/png' ? 'png' : fayl.type === 'image/webp' ? 'webp' : 'jpg'
  const yol = `${foydalanuvchiId}/avatar-${Date.now()}.${kengaytma}`

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(yol, fayl, { contentType: fayl.type, upsert: true })
  if (error) throw error

  const eskiYol = avatarYoli(eskiHavola ?? null, foydalanuvchiId)
  if (eskiYol && eskiYol !== yol) {
    // Tozalash muvaffaqiyatsiz bo'lsa ham jim o'tamiz: rasm
    // allaqachon almashdi, foydalanuvchiga ko'rsatadigan xato yo'q.
    await supabase.storage.from(AVATAR_BUCKET).remove([eskiYol])
  }

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(yol).data.publicUrl
}

/** Profil rasmini butunlay olib tashlaydi (fayl ham o'chadi) */
export async function avatarniOchir(
  supabase: ReturnType<typeof useSupabase>,
  foydalanuvchiId: string,
  havola: string | null
): Promise<void> {
  const yol = avatarYoli(havola, foydalanuvchiId)
  if (yol) await supabase.storage.from(AVATAR_BUCKET).remove([yol])
}
