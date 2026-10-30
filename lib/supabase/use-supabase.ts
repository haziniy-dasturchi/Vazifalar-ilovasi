'use client'

import { useMemo } from 'react'
import { createClient } from './client'

/** Brauzer mijozini bir marta yaratib, qayta ishlatish */
export function useSupabase() {
  return useMemo(() => createClient(), [])
}
