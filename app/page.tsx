import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  CloudOff,
  FolderTree,
  Gauge,
  Moon,
  Play,
  ShieldCheck,
} from 'lucide-react'
import { DOMEN } from '@/lib/huquqiy'

/**
 * Ochiq bosh sahifa.
 *
 * Nega kerak: oldin bu manzil darhol `/jarayonda` ga yo'naltirardi va
 * qidiruv roboti faqat "Kirish" sahifasini ko'rardi — ya'ni saytda
 * indekslanadigan mazmun UMUMAN yo'q edi. Hech qancha meta teg buni
 * tuzatmaydi: Google avvalo MATNNI o'qiydi.
 *
 * Kirgan foydalanuvchi bu sahifani ko'rmaydi — middleware uni o'z
 * boshlang'ich bo'limiga o'tkazib yuboradi.
 */

const TAVSIF =
  'Samara — o‘zbek tilidagi bepul vazifalar va kunlik reja ilovasi. ' +
  'To-do ro‘yxati, eslatmalar, papkalar va kunlik hisobot. ' +
  'Reklamasiz, internetsiz ham ishlaydi.'

export const metadata: Metadata = {
  title: 'Samara — o‘zbek tilidagi vazifalar va kunlik reja ilovasi',
  description: TAVSIF,
  alternates: { canonical: DOMEN },
  openGraph: {
    type: 'website',
    url: DOMEN,
    siteName: 'Samara',
    locale: 'uz_UZ',
    title: 'Samara — vazifalar va kunlik reja ilovasi',
    description: TAVSIF,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samara — vazifalar va kunlik reja ilovasi',
    description: TAVSIF,
  },
}

const IMKONIYATLAR = [
  {
    ikonka: Play,
    sarlavha: 'Bir vaqtda bitta ish',
    matn: 'Boshlangan vazifa alohida ko‘rinadi. “Nima qilishim kerak?” degan savol bir bosishda hal bo‘ladi.',
  },
  {
    ikonka: CalendarDays,
    sarlavha: 'Kunlik va kelgusi reja',
    matn: 'Bugungi, kechikkan va oldindagi ishlar alohida ro‘yxatlarda. Takrorlanadigan vazifalar ham bor.',
  },
  {
    ikonka: BellRing,
    sarlavha: 'Vaqtli eslatmalar',
    matn: 'Vaqti belgilangan vazifa haqida telefoningizga bildirishnoma keladi — ilova yopiq bo‘lsa ham.',
  },
  {
    ikonka: FolderTree,
    sarlavha: 'Papka va loyihalar',
    matn: 'Ish, o‘qish, uy yumushlari — har birini alohida papkaga ajrating, ichida bo‘limlar oching.',
  },
  {
    ikonka: Gauge,
    sarlavha: 'Bajarilish foizi',
    matn: 'Bir kunda tugamaydigan ishni foiz bilan belgilang: bugun 50%, qolganini ertaga davom ettiring.',
  },
  {
    ikonka: CloudOff,
    sarlavha: 'Internetsiz ishlaydi',
    matn: 'Aloqa yo‘qolsa ham yozganingiz saqlanadi va internet tiklanishi bilan o‘zi yuboriladi.',
  },
  {
    ikonka: Moon,
    sarlavha: 'Tungi rejim',
    matn: 'Yorug‘, qorong‘i yoki qurilma sozlamasiga moslashadigan ko‘rinish.',
  },
  {
    ikonka: ShieldCheck,
    sarlavha: 'Reklamasiz va bepul',
    matn: 'Reklama yo‘q, kuzatuv tizimlari yo‘q. Ma’lumotlaringiz sotilmaydi.',
  },
]

const SAVOLLAR = [
  {
    savol: 'Samara bepulmi?',
    javob:
      'Ha, butunlay bepul. Pulli tarif, reklama va yashirin to‘lovlar yo‘q.',
  },
  {
    savol: 'Ilovani telefonga o‘rnatsa bo‘ladimi?',
    javob:
      'Ha. Samara — PWA ilova: brauzerda ochib, bosh ekranga qo‘shasiz va u oddiy ilova kabi ishlaydi. Android’da “O‘rnatish” tugmasi chiqadi, iPhone’da Safari’dagi Ulashish → “Bosh ekranga qo‘shish”.',
  },
  {
    savol: 'Internetsiz ishlaydimi?',
    javob:
      'Ha. Internetsiz qo‘shilgan va o‘zgartirilgan vazifalar qurilmada saqlanadi, aloqa tiklanganda esa o‘zi serverga yuboriladi.',
  },
  {
    savol: 'Eslatmalar qanday ishlaydi?',
    javob:
      'Vazifaga vaqt belgilansa, o‘sha paytda telefoningizga bildirishnoma keladi. Buning uchun bildirishnomaga bir marta ruxsat berish kifoya.',
  },
  {
    savol: 'Ma’lumotlarim xavfsizmi?',
    javob:
      'Har bir foydalanuvchi faqat o‘z ma’lumotini ko‘radi — bu baza darajasida majburlanadi. Hisobni istalgan vaqtda ilova ichidan butunlay o‘chirib tashlashingiz mumkin.',
  },
]

/** Qidiruv tizimlari uchun tuzilgan ma'lumot (rich result) */
function strukturaliMalumot() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Samara',
        alternateName: 'Samara — vazifalar ilovasi',
        url: DOMEN,
        description: TAVSIF,
        applicationCategory: 'ProductivityApplication',
        operatingSystem: 'Android, iOS, Windows, macOS, Linux',
        inLanguage: 'uz',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'UZS',
        },
        featureList: IMKONIYATLAR.map((i) => i.sarlavha),
      },
      {
        '@type': 'FAQPage',
        mainEntity: SAVOLLAR.map((s) => ({
          '@type': 'Question',
          name: s.savol,
          acceptedAnswer: { '@type': 'Answer', text: s.javob },
        })),
      },
    ],
  }
}

export default function Bosh() {
  return (
    <>
      <script
        type="application/ld+json"
        // Tarkib shu fayldagi o'zgarmas matnlardan tuziladi —
        // foydalanuvchi kiritgan ma'lumot aralashmaydi
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(strukturaliMalumot()),
        }}
      />

      <main className="mx-auto w-full max-w-4xl px-5 py-12 md:py-20">
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
          <img
            src="/brand/logo-login-light.svg"
            alt="Samara"
            width={180}
            height={135}
            className="faqat-yorug mx-auto h-auto w-40"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG */}
          <img
            src="/brand/logo-login-dark.svg"
            alt=""
            aria-hidden
            width={180}
            height={135}
            className="faqat-qorongi mx-auto h-auto w-40"
          />

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-strong md:text-4xl">
            Vazifalar va kunlik reja ilovasi — o‘zbek tilida
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-muted md:text-lg">
            Samara kunlik ishlaringizni bir joyda rejalashtirish va bajarish
            uchun. To-do ro‘yxati, vaqtli eslatmalar, papkalar va kunlik
            hisobot. Reklamasiz, kuzatuvsiz, hamma uchun bepul.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/kirish"
              data-touch
              className="flex min-h-touch items-center gap-2 rounded-2xl bg-brand-primary px-7 text-base font-semibold text-white shadow-card transition hover:bg-brand-primary-hover"
            >
              <CheckCircle2 className="size-5" aria-hidden />
              Bepul boshlash
            </Link>
          </div>

          <p className="mt-3 text-sm text-text-faint">
            Google hisobingiz bilan kiring — alohida parol o‘ylab topish shart
            emas.
          </p>
        </header>

        <section className="mt-16" aria-labelledby="imkoniyatlar">
          <h2
            id="imkoniyatlar"
            className="text-2xl font-bold text-text-strong md:text-3xl"
          >
            Nimalar bor
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {IMKONIYATLAR.map(({ ikonka: Ikonka, sarlavha, matn }) => (
              <li
                key={sarlavha}
                className="flex items-start gap-4 rounded-2xl bg-surface p-5 shadow-card"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                  <Ikonka className="size-5 text-brand-onsoft" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-strong">{sarlavha}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {matn}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="savollar">
          <h2
            id="savollar"
            className="text-2xl font-bold text-text-strong md:text-3xl"
          >
            Ko‘p so‘raladigan savollar
          </h2>
          <dl className="mt-6 space-y-3">
            {SAVOLLAR.map(({ savol, javob }) => (
              <div
                key={savol}
                className="rounded-2xl bg-surface p-5 shadow-card"
              >
                <dt className="font-semibold text-text-strong">{savol}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-text-muted">
                  {javob}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 rounded-3xl bg-brand-soft p-8 text-center">
          <h2 className="text-2xl font-bold text-text-strong">
            Bugundan boshlang
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-text-muted">
            Ro‘yxatdan o‘tish bir bosishda. Hech qanday to‘lov ma’lumoti
            so‘ralmaydi.
          </p>
          <Link
            href="/kirish"
            data-touch
            className="mt-6 inline-flex min-h-touch items-center gap-2 rounded-2xl bg-brand-primary px-7 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Samara’ni ochish
          </Link>
        </section>

        <footer className="mt-14 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-muted">
          <Link href="/maxfiylik" className="hover:text-text-strong">
            Maxfiylik siyosati
          </Link>
          <Link href="/shartlar" className="hover:text-text-strong">
            Foydalanish shartlari
          </Link>
          <Link href="/hisobni-ochirish" className="hover:text-text-strong">
            Hisobni o‘chirish
          </Link>
        </footer>
      </main>
    </>
  )
}
