import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

/** Server komponentlar, Route Handler va Server Action'lar uchun mijoz */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component ichidan cookie yozib bo'lmaydi —
          // sessiyani middleware yangilab turadi.
        }
      },
    },
  })
}
