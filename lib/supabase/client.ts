'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

let mijoz: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Brauzerdagi Supabase mijozi — butun ilova uchun bitta nusxa.
 *
 * Har bir sahifa o'tishida qayta yaratilsa, GoTrueClient va uning auth
 * tinglovchilari har safar qaytadan ishga tushadi — bu telefonda sezilarli
 * sekinlik qo'shadi. Shu sababli bir marta yaratib, modul darajasida saqlaymiz.
 */
export function createClient() {
  if (!mijoz) {
    mijoz = createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
  }
  return mijoz
}
