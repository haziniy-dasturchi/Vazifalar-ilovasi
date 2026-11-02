'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { kalit } from './keys'
import type { Foydalanuvchi } from '@/components/app/foydalanuvchi'

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
