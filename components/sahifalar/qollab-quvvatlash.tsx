'use client'

import { useEffect, useState } from 'react'
import { Heart, MessageSquare, Share2, Star } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { XayriyaBolimi } from '@/components/qollab/xayriya-bolimi'
import { KartaBolimi } from '@/components/qollab/karta-bolimi'
import { havolaniUlash } from '@/components/topshiriq/jamoa-bolimi'
import { ALOQA_EMAIL, DOMEN, ILOVA_NOMI, PLAY_STORE_HAVOLASI } from '@/lib/huquqiy'
import { ilovaNativemi } from '@/lib/platform'
import { ILOVADA_TOLOV_KORSATILSIN, XARAJATLAR } from '@/lib/qollab'

/**
 * "Loyihani qo'llab-quvvatlash".
 *
 * Maqsad — odamga ilova bepul ekanini, lekin uni ushlab turish
 * xarajat talab qilishini ODDIY tilda ko'rsatish. "Supabase", "Vercel"
 * kabi so'zlar ataylab yo'q: odam uchun bu "server" va "sayt".
 *
 * Matn faqat o'zbekcha — yo'riqnoma kabi. Xarajatlar ro'yxati
 * `lib/qollab.ts` da, to'lov — `components/qollab/xayriya-bolimi.tsx`.
 */

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
  // Sahifa build paytida (veb sifatida) chiziladi — app ekanini
  // faqat yuklangandan keyin bilamiz, aks holda hydration xatosi
  const [native, setNative] = useState(false)
  useEffect(() => setNative(ilovaNativemi()), [])
  const tolovKorinadi = !native || ILOVADA_TOLOV_KORSATILSIN

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
              Ilovani ishlatib turish xarajatlarini hozircha muallifning
              o‘zi ko‘tarib kelmoqda.
            </p>
          </div>
        </div>
      </section>

      {/* To'lov — darhol ko'rinadigan joyda, asosiy xabardan keyin */}
      {tolovKorinadi && <XayriyaBolimi />}
      {tolovKorinadi && <KartaBolimi />}

      {/* Xarajatlar — ataylab summasiz: maqsad hisobot emas, odamga
          ilova bepul emasligini qisqa tushuntirish */}
      <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
        <h2 className="font-semibold text-text-strong">
          Ilova nimaga xarajat qiladi
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {XARAJATLAR.map((x) => (
            <li
              key={x.nom}
              className="rounded-xl bg-surface-muted px-3.5 py-2.5"
            >
              <p className="text-sm font-medium text-text-strong">{x.nom}</p>
              <p className="text-xs text-text-muted">{x.izoh}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Bu xarajatlar har oy va har yili takrorlanadi. Sizning
          qo‘llab-quvvatlashingiz {ILOVA_NOMI} bepul va bardavom qolishiga
          yordam beradi.
        </p>
      </section>

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
