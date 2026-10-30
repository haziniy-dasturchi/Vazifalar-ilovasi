'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

/** Brauzerdagi Supabase mijozi (klient komponentlar uchun) */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
}
