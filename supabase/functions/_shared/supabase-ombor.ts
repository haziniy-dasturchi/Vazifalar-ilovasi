/**
 * `XayriyaOmbori` ning haqiqiy amalga oshirilishi — Supabase service
 * role orqali (RLS chetlab o'tiladi: Payme/Click foydalanuvchi emas).
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { Xayriya, XayriyaOmbori } from './xayriya-ombori.ts'

const USTUNLAR =
  'id, raqam, summa_tiyin, tizim, holat, tolandi_at, payme_tx_id, payme_time, ' +
  'payme_create_time, payme_perform_time, payme_cancel_time, payme_state, ' +
  'payme_reason, click_trans_id, click_paydoc_id'

export function supabaseOmbor(db: SupabaseClient): XayriyaOmbori {
  const jadval = () => db.from('xayriyalar')

  return {
    async idBoyicha(id) {
      const { data, error } = await jadval().select(USTUNLAR).eq('id', id).maybeSingle()
      if (error) throw error
      return data as Xayriya | null
    },

    async paymeTxBoyicha(txId) {
      const { data, error } = await jadval()
        .select(USTUNLAR)
        .eq('payme_tx_id', txId)
        .maybeSingle()
      if (error) throw error
      return data as Xayriya | null
    },

    async yangila(id, ozgarish, shart = {}) {
      let sorov = jadval().update(ozgarish).eq('id', id)
      for (const [ustun, qiymat] of Object.entries(shart)) {
        sorov = qiymat === null ? sorov.is(ustun, null) : sorov.eq(ustun, qiymat)
      }
      const { data, error } = await sorov.select(USTUNLAR).maybeSingle()
      if (error) throw error
      return data as Xayriya | null
    },

    async paymeDavrda(dan, gacha) {
      const { data, error } = await jadval()
        .select(USTUNLAR)
        .not('payme_tx_id', 'is', null)
        .gte('payme_time', dan)
        .lte('payme_time', gacha)
        .order('payme_time')
      if (error) throw error
      return (data ?? []) as Xayriya[]
    },
  }
}
