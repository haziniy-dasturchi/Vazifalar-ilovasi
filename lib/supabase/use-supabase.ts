'use client'

import { createClient } from './client'

/** Brauzer mijozi modul darajasida yagona — bu yerda shunchaki qaytariladi */
export function useSupabase() {
  return createClient()
}
