import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shell } from '@/components/app/shell'
import type { Foydalanuvchi } from '@/components/app/foydalanuvchi'

/**
 * Foydalanuvchini middleware tekshirib qo'ygan sarlavhadan o'qiydi —
 * shunda Supabase'ga qayta (ikkinchi) tarmoq so'rovi yuborilmaydi.
 * Sarlavha yo'q bo'lsa (masalan middleware chetlab o'tilgan holatlar
 * uchun zaxira), odatdagidek getUser() bilan tekshiradi.
 */
async function foydalanuvchiniOl(): Promise<Foydalanuvchi> {
  const sarlavhalar = await headers()
  const xom = sarlavhalar.get('x-vazifalar-user')

  if (xom) {
    try {
      return JSON.parse(xom) as Foydalanuvchi
    } catch {
      // Noto'g'ri formatda bo'lsa, pastdagi zaxira yo'lga o'tamiz
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/kirish')

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
  return {
    id: user.id,
    email: user.email ?? '',
    ism:
      meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Foydalanuvchi',
    rasm: meta.avatar_url ?? null,
  }
}

export default async function IlovaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const foydalanuvchi = await foydalanuvchiniOl()

  return <Shell foydalanuvchi={foydalanuvchi}>{children}</Shell>
}
