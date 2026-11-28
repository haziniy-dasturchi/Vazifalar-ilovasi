'use client'

import { useEffect, useState } from 'react'
import {
  Copy,
  ExternalLink,
  Gift,
  Heart,
  MessageSquare,
  Share2,
  Star,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { useToast } from '@/components/ui/toast'
import { havolaniUlash } from '@/components/topshiriq/jamoa-bolimi'
import { ALOQA_EMAIL, DOMEN, ILOVA_NOMI, PLAY_STORE_HAVOLASI } from '@/lib/huquqiy'
import { ilovaNativemi } from '@/lib/platform'
import {
  ILOVADA_TOLOV_KORSATILSIN,
  TOLOV_USULLARI,
  XARAJATLAR,
  type Xarajat,
} from '@/lib/qollab'

/**
 * "Loyihani qo'llab-quvvatlash".
 *
 * Maqsad — odamga ilova nega bepul ekanini va uni ushlab turish
 * qancha turishini ODDIY tilda ko'rsatish. "Supabase", "Vercel"
 * kabi so'zlar ataylab yo'q: odam uchun bu "server" va "sayt".
 *
 * Matn faqat o'zbekcha — yo'riqnoma kabi. Raqamlar va to'lov
 * usullari `lib/qollab.ts` da.
 */

const DAVR: Record<Xarajat['davr'], string> = {
  oy: 'har oy',
  yil: 'har yili',
  'bir marta': 'bir marta',
}

/** Alohida sahifa — yon panel va telefon panelidagi havola shu yerga */
export function QollabQuvvatlashKorinishi() {
  return (
    <Sahifa
      sarlavha="Loyihani qo‘llab-quvvatlash"
      tavsif={`${ILOVA_NOMI} hamma uchun bepul. Shunday qolishi sizga ham bog‘liq.`}
    >
      <QollabQuvvatlashMazmuni />
    </Sahifa>
  )
}

/** Sahifa karkasisiz mazmun — Sozlamalar tabi ham shuni ishlatadi */
export function QollabQuvvatlashMazmuni() {
  const { korsat } = useToast()
  // Sahifa build paytida (veb sifatida) chiziladi — app ekanini
  // faqat yuklangandan keyin bilamiz, aks holda hydration xatosi
  const [native, setNative] = useState(false)
  useEffect(() => setNative(ilovaNativemi()), [])
  const tolovKorinadi =
    TOLOV_USULLARI.length > 0 && (!native || ILOVADA_TOLOV_KORSATILSIN)

  async function nusxaOl(qiymat: string) {
    try {
      await navigator.clipboard.writeText(qiymat.replace(/\s/g, ''))
      korsat({ matn: 'Nusxa olindi', tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: 'Nusxa olib bo‘lmadi', tone: 'xato' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Asosiy xabar */}
      <section className="rounded-2xl bg-brand-soft p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
            <Heart className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-brand-onsoft">
              {ILOVA_NOMI} mutlaqo bepul
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-strong">
              Reklama yo‘q, pulli tarif yo‘q, ma’lumotlaringiz sotilmaydi.
              Lekin ilovani ishlatib turish bepul emas: server, domen va
              do‘konlardagi hisoblar uchun har oy pul to‘lanadi. Bu
              xarajatlarni hozircha muallifning o‘zi ko‘tarib kelmoqda.
            </p>
          </div>
        </div>
      </section>

      {/* Xarajatlar */}
      <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
        <h2 className="font-semibold text-text-strong">
          Pul nimaga sarflanadi
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Ilova ishlab turishi uchun muntazam to‘lanadigan xarajatlar,
          masalan:
        </p>

        <ul className="mt-4 divide-y divide-border-subtle">
          {XARAJATLAR.map((x) => (
            <li
              key={x.nom}
              className="flex items-start justify-between gap-4 py-3 first:pt-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-strong">{x.nom}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                  {x.izoh}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs whitespace-nowrap text-text-muted">
                {DAVR[x.davr]}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-xs leading-relaxed text-text-faint">
          Bundan tashqari, ilovani yangilash va xatolarni tuzatishga
          ketadigan vaqt ham bor.
        </p>
      </section>

      {/* To'lov usullari */}
      {tolovKorinadi && (
        <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
          <h2 className="flex items-center gap-2 font-semibold text-text-strong">
            <Gift className="size-4 text-brand-onsoft" aria-hidden />
            Pul bilan yordam berish
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Istalgan summa — hatto 5 000 so‘m ham — server to‘lovining bir
            qismini yopadi. Bu ixtiyoriy: ilova to‘lov qilmaganlar uchun
            ham hech narsasi cheklanmaydi.
          </p>
          <ul className="mt-4 space-y-2">
            {TOLOV_USULLARI.map((u) => (
              <li
                key={u.nom}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-strong">{u.nom}</p>
                  {u.qiymat && (
                    <p className="truncate text-sm text-text-muted tabular-nums">
                      {u.qiymat}
                    </p>
                  )}
                </div>
                {u.havola ? (
                  <a
                    href={u.havola}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-touch shrink-0 items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    To‘lash
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                ) : u.qiymat ? (
                  <button
                    type="button"
                    onClick={() => nusxaOl(u.qiymat!)}
                    className="flex min-h-touch shrink-0 items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
                  >
                    <Copy className="size-4" aria-hidden />
                    Nusxa
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pulsiz yordam */}
      <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
        <h2 className="font-semibold text-text-strong">
          Pulsiz ham yordam bera olasiz
        </h2>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              onClick={() =>
                havolaniUlash(
                  `${ILOVA_NOMI} — kunni rejalash uchun bepul ilova. Men ishlatyapman, sizga ham tavsiya qilaman:`,
                  DOMEN
                )
              }
              className="flex w-full min-h-touch items-center gap-3 rounded-xl px-3 text-left text-sm text-text-strong transition hover:bg-surface-muted"
            >
              <Share2 className="size-5 shrink-0 text-brand-onsoft" aria-hidden />
              <span>
                <span className="block font-medium">Do‘stlarga ulashing</span>
                <span className="block text-xs text-text-muted">
                  Ko‘proq odam ishlatsa, loyiha shuncha uzoq yashaydi.
                </span>
              </span>
            </button>
          </li>
          {PLAY_STORE_HAVOLASI && (
            <li>
              <a
                href={PLAY_STORE_HAVOLASI}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-touch items-center gap-3 rounded-xl px-3 text-sm text-text-strong transition hover:bg-surface-muted"
              >
                <Star className="size-5 shrink-0 text-brand-onsoft" aria-hidden />
                <span>
                  <span className="block font-medium">Play Market’da baho qo‘ying</span>
                  <span className="block text-xs text-text-muted">
                    Yaxshi baho ilovani boshqalarga ko‘rinadigan qiladi.
                  </span>
                </span>
              </a>
            </li>
          )}
          <li>
            <a
              href={`mailto:${ALOQA_EMAIL}?subject=${encodeURIComponent(`${ILOVA_NOMI}: taklif`)}`}
              className="flex min-h-touch items-center gap-3 rounded-xl px-3 text-sm text-text-strong transition hover:bg-surface-muted"
            >
              <MessageSquare className="size-5 shrink-0 text-brand-onsoft" aria-hidden />
              <span>
                <span className="block font-medium">Fikr va taklif yuboring</span>
                <span className="block text-xs text-text-muted">
                  Xato topdingizmi yoki biror narsa yetishmayaptimi — yozing.
                </span>
              </span>
            </a>
          </li>
        </ul>
      </section>

      <p className="px-1 text-center text-sm text-text-muted">
        {ILOVA_NOMI}dan foydalanayotganingiz uchun rahmat!
      </p>
    </div>
  )
}
