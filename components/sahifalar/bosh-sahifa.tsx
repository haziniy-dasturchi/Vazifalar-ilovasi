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
import {
  TILLAR,
  matn,
  tarjimon,
  tilMalumoti,
  tilPrefiksi,
  type MatnKaliti,
  type Til,
} from '@/lib/i18n'

/**
 * Ochiq bosh sahifa — uch tilda.
 *
 * Nega kerak: oldin `/` darhol ilovaga yo'naltirardi va qidiruv
 * roboti butun saytda faqat "Kirish" sahifasini ko'rardi, ya'ni
 * indekslanadigan mazmun umuman yo'q edi.
 *
 * Har til alohida manzilda (`/`, `/en`, `/ru`) — shunda Google
 * uchalasini alohida sahifa sifatida indekslaydi va har biri o'z
 * tilidagi so'rovlarda chiqadi.
 */

const IMKONIYATLAR: { ikonka: typeof Play; nom: MatnKaliti; matn: MatnKaliti }[] = [
  { ikonka: Play, nom: 'bosh.imkoniyat.bittaIsh.nom', matn: 'bosh.imkoniyat.bittaIsh.matn' },
  { ikonka: CalendarDays, nom: 'bosh.imkoniyat.reja.nom', matn: 'bosh.imkoniyat.reja.matn' },
  { ikonka: BellRing, nom: 'bosh.imkoniyat.eslatma.nom', matn: 'bosh.imkoniyat.eslatma.matn' },
  { ikonka: FolderTree, nom: 'bosh.imkoniyat.papka.nom', matn: 'bosh.imkoniyat.papka.matn' },
  { ikonka: Gauge, nom: 'bosh.imkoniyat.foiz.nom', matn: 'bosh.imkoniyat.foiz.matn' },
  { ikonka: CloudOff, nom: 'bosh.imkoniyat.offline.nom', matn: 'bosh.imkoniyat.offline.matn' },
  { ikonka: Moon, nom: 'bosh.imkoniyat.mavzu.nom', matn: 'bosh.imkoniyat.mavzu.matn' },
  { ikonka: ShieldCheck, nom: 'bosh.imkoniyat.bepul.nom', matn: 'bosh.imkoniyat.bepul.matn' },
]

const SAVOLLAR: { savol: MatnKaliti; javob: MatnKaliti }[] = [
  { savol: 'bosh.savol.bepul', javob: 'bosh.javob.bepul' },
  { savol: 'bosh.savol.ornatish', javob: 'bosh.javob.ornatish' },
  { savol: 'bosh.savol.offline', javob: 'bosh.javob.offline' },
  { savol: 'bosh.savol.eslatma', javob: 'bosh.javob.eslatma' },
  { savol: 'bosh.savol.xavfsizlik', javob: 'bosh.javob.xavfsizlik' },
]

/**
 * Har til uchun meta teglar.
 *
 * `alternates.languages` — hreflang. Busiz Google uchta sahifani
 * bir-birining nusxasi deb hisoblab, faqat bittasini ko'rsatishi
 * mumkin edi.
 */
export function boshMetadata(til: Til): Metadata {
  const t = tarjimon(til)
  const manzil = `${DOMEN}${tilPrefiksi(til)}` || DOMEN

  const tillar: Record<string, string> = {}
  for (const { kod } of TILLAR) {
    tillar[kod] = `${DOMEN}${tilPrefiksi(kod)}` || DOMEN
  }
  tillar['x-default'] = DOMEN

  /*
    Ulashish rasmi ANIQ ko'rsatiladi.

    Next `app/opengraph-image.png` ni avtomatik qo'shadi, lekin faqat
    sahifa o'zining `openGraph` obyektini belgilamagan bo'lsa.
    Belgilansa — ildizdagi rasm meros bo'lmaydi va `/en`, `/ru`
    ijtimoiy tarmoqda rasmsiz ulashilardi (sinovda aniqlandi).
  */
  const rasm = {
    url: `${DOMEN}/opengraph-image.png`,
    width: 1200,
    height: 630,
    alt: 'Samara',
  }

  return {
    /*
      `absolute` ataylab: ildiz layout'da `'%s · Samara'` shabloni bor
      va u ichki sahifalarga qo'llanadi. Usiz sarlavha "Samara — ...
      · Samara" bo'lib, brend ikki marta takrorlanardi va uzunlik
      qidiruv natijasida kesiladigan chegaradan oshib ketardi.
    */
    title: { absolute: t('bosh.meta.sarlavha') },
    description: t('bosh.meta.tavsif'),
    alternates: { canonical: manzil, languages: tillar },
    openGraph: {
      type: 'website',
      url: manzil,
      siteName: 'Samara',
      locale: tilMalumoti(til).ogLocale,
      title: t('bosh.meta.qisqaSarlavha'),
      description: t('bosh.meta.tavsif'),
      images: [rasm],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('bosh.meta.qisqaSarlavha'),
      description: t('bosh.meta.tavsif'),
      images: [rasm],
    },
  }
}

function strukturaliMalumot(til: Til) {
  const t = tarjimon(til)
  const manzil = `${DOMEN}${tilPrefiksi(til)}` || DOMEN

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Samara',
        url: manzil,
        description: t('bosh.meta.tavsif'),
        applicationCategory: 'ProductivityApplication',
        operatingSystem: 'Android, iOS, Windows, macOS, Linux',
        inLanguage: til,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'UZS' },
        featureList: IMKONIYATLAR.map((i) => t(i.nom)),
      },
      {
        '@type': 'FAQPage',
        inLanguage: til,
        mainEntity: SAVOLLAR.map((s) => ({
          '@type': 'Question',
          name: t(s.savol),
          acceptedAnswer: { '@type': 'Answer', text: t(s.javob) },
        })),
      },
    ],
  }
}

export function BoshSahifa({ til }: { til: Til }) {
  const t = tarjimon(til)

  return (
    <>
      <script
        type="application/ld+json"
        // Tarkib faqat shu loyihadagi o'zgarmas matnlardan tuziladi
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(strukturaliMalumot(til)),
        }}
      />

      {/*
        `lang` shu yerda: ildiz layout hamma sahifa uchun umumiy va
        unda til "uz" deb yozilgan. Uni so'rovga qarab o'zgartirish
        butun ilovani dinamik render'ga o'tkazib yuborardi (layout
        izohiga qarang). Konteynerdagi `lang` esa HTML standarti
        bo'yicha to'liq yaroqli: qidiruv tizimi ham, ekran o'qigich
        ham shu qism uchun aynan shu tilni oladi.
      */}
      <main
        lang={til}
        className="mx-auto w-full max-w-4xl px-5 py-12 md:py-20"
      >
        <nav
          aria-label={matn(til, 'bosh.tilTanlash')}
          className="mb-10 flex justify-center gap-1"
        >
          {TILLAR.map(({ kod, nomOzTilida }) => {
            const tanlangan = kod === til
            return (
              <Link
                key={kod}
                href={tilPrefiksi(kod) || '/'}
                hrefLang={kod}
                aria-current={tanlangan ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tanlangan
                    ? 'bg-brand-soft text-brand-onsoft'
                    : 'text-text-muted hover:bg-surface-muted hover:text-text-strong'
                }`}
              >
                {nomOzTilida}
              </Link>
            )
          })}
        </nav>

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
            {t('bosh.h1')}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-muted md:text-lg">
            {t('bosh.kirish')}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/kirish"
              data-touch
              className="flex min-h-touch items-center gap-2 rounded-2xl bg-brand-primary px-7 text-base font-semibold text-white shadow-card transition hover:bg-brand-primary-hover"
            >
              <CheckCircle2 className="size-5" aria-hidden />
              {t('bosh.tugma.boshlash')}
            </Link>
          </div>

          <p className="mt-3 text-sm text-text-faint">{t('bosh.kirishIzoh')}</p>
        </header>

        <section className="mt-16" aria-labelledby="imkoniyatlar">
          <h2
            id="imkoniyatlar"
            className="text-2xl font-bold text-text-strong md:text-3xl"
          >
            {t('bosh.imkoniyatlar.sarlavha')}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {IMKONIYATLAR.map(({ ikonka: Ikonka, nom, matn: tavsif }) => (
              <li
                key={nom}
                className="flex items-start gap-4 rounded-2xl bg-surface p-5 shadow-card"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                  <Ikonka className="size-5 text-brand-onsoft" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-strong">{t(nom)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {t(tavsif)}
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
            {t('bosh.savollar.sarlavha')}
          </h2>
          <dl className="mt-6 space-y-3">
            {SAVOLLAR.map(({ savol, javob }) => (
              <div key={savol} className="rounded-2xl bg-surface p-5 shadow-card">
                <dt className="font-semibold text-text-strong">{t(savol)}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-text-muted">
                  {t(javob)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 rounded-3xl bg-brand-soft p-8 text-center">
          <h2 className="text-2xl font-bold text-text-strong">
            {t('bosh.chaqiriq.sarlavha')}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-text-muted">
            {t('bosh.chaqiriq.matn')}
          </p>
          <Link
            href="/kirish"
            data-touch
            className="mt-6 inline-flex min-h-touch items-center gap-2 rounded-2xl bg-brand-primary px-7 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            {t('bosh.tugma.ochish')}
          </Link>
        </section>

        <footer className="mt-14 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-muted">
          <Link href="/maxfiylik" className="hover:text-text-strong">
            {t('bosh.havola.maxfiylik')}
          </Link>
          <Link href="/shartlar" className="hover:text-text-strong">
            {t('bosh.havola.shartlar')}
          </Link>
          <Link href="/hisobni-ochirish" className="hover:text-text-strong">
            {t('bosh.havola.hisobOchirish')}
          </Link>
        </footer>
      </main>
    </>
  )
}
