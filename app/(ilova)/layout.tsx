import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shell } from '@/components/app/shell'

export default async function IlovaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/kirish')

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>

  return (
    <Shell
      foydalanuvchi={{
        id: user.id,
        ism:
          meta.full_name ??
          meta.name ??
          user.email?.split('@')[0] ??
          'Foydalanuvchi',
        email: user.email ?? '',
        rasm: meta.avatar_url ?? null,
      }}
    >
      {children}
    </Shell>
  )
}
