'use client'

import { havolalarniAjrat } from '@/lib/havolalar'

/**
 * Matndagi havolalarni bosiladigan qiladi.
 *
 * HTML yasalmaydi — React matnni o'zi ekranlaydi, shuning uchun
 * izohga yozilgan `<script>` hech qachon kodga aylanmaydi.
 *
 * `toxtat`: vazifa qatori butunlay bosiladigan (bosilsa tahrirlash
 * oynasi ochiladi). Havola bosilganda o'sha oyna ochilib ketmasligi
 * uchun hodisa to'xtatiladi.
 */
export function HavolaliMatn({
  matn,
  toxtat = false,
}: {
  matn: string
  toxtat?: boolean
}) {
  const bolaklar = havolalarniAjrat(matn)

  return (
    <>
      {bolaklar.map((b, i) =>
        b.tur === 'havola' ? (
          <a
            key={i}
            href={b.manzil}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (toxtat) e.stopPropagation()
            }}
            className="text-brand-onsoft underline underline-offset-2 hover:opacity-80"
          >
            {b.matn}
          </a>
        ) : (
          <span key={i}>{b.matn}</span>
        )
      )}
    </>
  )
}
