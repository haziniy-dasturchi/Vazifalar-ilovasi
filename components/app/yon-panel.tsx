'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Plus, Send } from 'lucide-react'
import { ProfilMenyu } from './profil-menyu'
import { useT } from './til-provayder'
import { useBolimTartibi } from '@/lib/queries/bolim-tartibi'
import { useTopshiriqBelgisi } from '@/lib/queries/topshiriqlar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { PapkaOynasi } from '@/components/papka/papka-oynasi'
import { usePapkaniOldindanYuklash } from '@/lib/queries/vazifalar'
import { useBolimlarniOldindanYuklash } from '@/lib/queries/bolimlar'
import { PAPKA_ZAXIRA_ID, papkaYoli } from '@/lib/yollar'

export function YonPanel() {
  const yol = usePathname()
  // Appda papka ID'si so'rov parametrida keladi (izoh: lib/yollar.ts)
  const soroqId = useSearchParams().get('id')
  const BOLIMLAR = useBolimTartibi()
  const t = useT()
  const { data: papkalar, isPending } = useFaolPapkalar()
  // Javob kutayotgan kelganlar + tasdiq kutayotgan yuborilganlar
  const kutilayotgan = useTopshiriqBelgisi()
  const [oynaOchiq, setOynaOchiq] = useState(false)
  const papkaniOldindanYukla = usePapkaniOldindanYuklash()
  const bolimlarniOldindanYukla = useBolimlarniOldindanYuklash()

  function papkaUstigaTegish(papkaId: string) {
    papkaniOldindanYukla(papkaId)
    bolimlarniOldindanYukla(papkaId)
  }

  // Loyihalar papkasi oddiylaridan ajratiladi — u pastda, o'z
  // sarlavhasi bilan ko'rsatiladi
  const loyihalarPapkasi = papkalar?.find((p) => p.is_projects)
  const oddiyPapkalar = papkalar?.filter((p) => !p.is_projects) ?? []

  function papkaQatori(papka: (typeof oddiyPapkalar)[number]) {
    const Ikonka = papkaIkonkasi(papka.icon, papka.is_inbox)
    const faol =
      yol.replace(/\/$/, '') === `/papka/${papka.id}` ||
      (yol.replace(/\/$/, '') === `/papka/${PAPKA_ZAXIRA_ID}` && soroqId === papka.id)
    return (
      <li key={papka.id}>
        <Link
          href={papkaYoli(papka.id)}
          aria-current={faol ? 'page' : undefined}
          onPointerEnter={() => papkaUstigaTegish(papka.id)}
          onPointerDown={() => papkaUstigaTegish(papka.id)}
          className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-base transition ${
            faol
              ? 'bg-brand-soft font-semibold text-brand-onsoft'
              : 'text-text-strong hover:bg-surface-muted'
          }`}
        >
          <Ikonka
            className="size-5 shrink-0"
            style={{ color: papka.color }}
            aria-hidden
          />
          <span className="truncate">{papka.name}</span>
        </Link>
      </li>
    )
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
      {/* Logo "Bugun" ga olib boradi. Oldin u umuman bosilmasdi —
          odam esa logoni bosib kunlik ro'yxatga qaytishga o'rgangan. */}
      <Link
        href="/bugun"
        aria-label={t('nav.bugun')}
        className="block px-5 py-5 transition hover:opacity-80"
      >
        {/* Qorong'i fonda to'q yashil yozuv o'qilmaydi — oq variantga
            almashadi. Ikkinchi rasm `alt`siz: ikkalasi bir xil narsa,
            skrinreader ikki marta o'qimasligi kerak. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
        <img
          src="/brand/logo-sidebar-light.svg"
          alt="Samara"
          width={133}
          height={36}
          className="faqat-yorug h-9 w-auto"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
        <img
          src="/brand/logo-sidebar-dark.svg"
          alt=""
          aria-hidden
          width={133}
          height={36}
          className="faqat-qorongi h-9 w-auto"
        />
      </Link>

      <nav aria-label={t('nav.asosiyBolimlar')} className="px-3">
        <ul className="space-y-1">
          {BOLIMLAR.map(({ yol: manzil, nom, ikonka: Ikonka }) => {
            const faol = yol === manzil
            return (
              <li key={manzil}>
                <Link
                  href={manzil}
                  aria-current={faol ? 'page' : undefined}
                  className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-base font-medium transition ${
                    faol
                      ? 'bg-brand-soft text-brand-onsoft'
                      : 'text-text-strong hover:bg-surface-muted'
                  }`}
                >
                  <Ikonka className="size-5 shrink-0" aria-hidden />
                  {t(nom)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Topshiriqlar — javob kutayotganlari soni bilan.
          Telefonda ham pastki menyuda, ajratuvchi chiziqdan keyin:
          yangi topshiriq kelgani u yerda ham bilinishi kerak. */}
      <nav aria-label={t('topshiriq.bolimi')} className="mt-6 shrink-0 px-3">
        <ul>
          <li>
            <Link
              href="/topshiriqlar"
              aria-current={yol === '/topshiriqlar' ? 'page' : undefined}
              className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-base transition ${
                yol === '/topshiriqlar'
                  ? 'bg-brand-soft font-semibold text-brand-onsoft'
                  : 'text-text-strong hover:bg-surface-muted'
              }`}
            >
              <Send className="size-5 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{t('topshiriq.bolimi')}</span>
              {kutilayotgan > 0 && (
                <span className="shrink-0 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {kutilayotgan}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>

      {/*
        Loyihalar — papkalardan YUQORIDA, alohida guruhda.

        Nega yuqorida: u hammada sukut bo'yicha turadi va oddiy
        papkadan boshqacha ishlaydi (ichidagi har bir bo'lim —
        alohida loyiha, o'z bajarilish foizi bilan). Papkalar
        ro'yxatining ichida, bir xil ko'rinishda turganda bu farq
        umuman sezilmasdi — odam uni yana bitta papka deb o'ylardi.
      */}
      {loyihalarPapkasi && (
        <nav
          aria-label={t('loyiha.bolimi')}
          className="mt-6 shrink-0 px-3"
        >
          <h2 className="mb-1 px-3 text-xs font-semibold tracking-wide text-text-faint uppercase">
            {t('loyiha.bolimi')}
          </h2>
          <ul className="space-y-1">{papkaQatori(loyihalarPapkasi)}</ul>
        </nav>
      )}

      <div className="mt-6 flex items-center justify-between px-6 pb-1">
        <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
          {t('nav.papkalar')}
        </h2>
        <button
          type="button"
          onClick={() => setOynaOchiq(true)}
          aria-label={t('nav.yangiPapka')}
          className="-mr-2 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-brand-onsoft"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>

      <nav
        aria-label={t('nav.papkalar')}
        className="flex-1 overflow-y-auto px-3 pb-4"
      >
        {isPending ? (
          <ul className="space-y-1 px-3 py-2">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-9 animate-pulse rounded-lg bg-surface-sunken"
              />
            ))}
          </ul>
        ) : (
          <ul className="space-y-1">{oddiyPapkalar.map(papkaQatori)}</ul>
        )}
      </nav>

      <ProfilMenyu />

      {oynaOchiq && <PapkaOynasi yop={() => setOynaOchiq(false)} />}
    </aside>
  )
}
