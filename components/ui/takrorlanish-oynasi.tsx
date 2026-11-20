'use client'

import { useState } from 'react'
import { Oyna } from '@/components/ui/oyna'
import { Tanlagich } from '@/components/ui/tanlagich'
import { useT } from '@/components/app/til-provayder'
import {
  BIRLIKLAR,
  BOSH_QOIDA,
  OXIRGI_KUN,
  matndanQoida,
  qoidaniMatnga,
  takrorMatni,
  type Birlik,
  type TakrorQoidasi,
} from '@/lib/takrorlanish'
import type { MatnKaliti } from '@/lib/i18n'

/**
 * "Boshqa…" — o'z takrorlanish qoidasini yig'ish oynasi.
 *
 * Tayyor to'rt variant ("har kuni", "ish kunlari"...) ko'pchilikka
 * yetadi, lekin "har oyning 15-sanasi", "har 2 haftada seshanba va
 * payshanba", "har oyning 2-seshanbasi" kabi jadvallarni umuman
 * qo'yib bo'lmasdi — odam har safar vazifani qo'lda qayta
 * yaratishga majbur edi.
 *
 * Natija RFC 5545 RRULE matni bo'lib chiqadi, ya'ni tayyor
 * variantlar bilan bir xil modelda saqlanadi.
 */

const BIRLIK_KALITI: Record<Birlik, MatnKaliti> = {
  kun: 'takror.birlik.kun',
  hafta: 'takror.birlik.hafta',
  oy: 'takror.birlik.oy',
  yil: 'takror.birlik.yil',
}

/** ISO tartibi: 1 dushanba ... 7 yakshanba */
const KUN_RAQAMLARI = [1, 2, 3, 4, 5, 6, 7] as const
const OY_KUNLARI = Array.from({ length: 31 }, (_, i) => i + 1)
const ORINLAR = [1, 2, 3, 4, OXIRGI_KUN]

export function TakrorlanishOynasi({
  rrule,
  bajarilgandan,
  sana,
  onSaqla,
  yop,
}: {
  rrule: string | null
  bajarilgandan: boolean
  /** Vazifaning joriy sanasi — oyna ochilganda oqilona boshlang'ich qiymat uchun */
  sana: string | null
  onSaqla: (rrule: string, bajarilgandan: boolean) => void
  yop: () => void
}) {
  const t = useT()

  const [qoida, setQoida] = useState<TakrorQoidasi>(
    () => matndanQoida(rrule) ?? boshlangich(sana)
  )
  const [bajarilgandanHolat, setBajarilgandan] = useState(bajarilgandan)

  function ozgartir(ozgarish: Partial<TakrorQoidasi>) {
    setQoida((eski) => ({ ...eski, ...ozgarish }))
  }

  function kunniAlmashtir(kun: number) {
    ozgartir({
      kunlar: qoida.kunlar.includes(kun)
        ? qoida.kunlar.filter((k) => k !== kun)
        : [...qoida.kunlar, kun],
    })
  }

  function oyKuniniAlmashtir(kun: number) {
    ozgartir({
      oyKunlari: qoida.oyKunlari.includes(kun)
        ? qoida.oyKunlari.filter((k) => k !== kun)
        : [...qoida.oyKunlari.filter((k) => k !== OXIRGI_KUN), kun],
    })
  }

  // Haftalik qoidada kun tanlanmagan bo'lsa, boshlanish sanasining
  // kuni olinadi — ya'ni "har hafta, shu kuni". Bu to'g'ri va
  // kutilgan xatti-harakat, shuning uchun bu yerda xato emas.
  const natija = qoidaniMatnga(qoida)
  const xulosa = takrorMatni(natija, t)

  // "Bajarilgan sanadan" + "N marta" — birga ma'nosiz: boshlanish
  // nuqtasi har safar siljiydi, demak sanash mumkin emas
  const martaChek = bajarilgandanHolat && qoida.tugash.tur === 'marta'

  return (
    <Oyna sarlavha={t('takror.sarlavha')} yop={yop}>
      {/* ---------- Asos ---------- */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-muted">
          {t('takror.asos')}
        </legend>
        <div className="space-y-2">
          <AsosQatori
            tanlangan={!bajarilgandanHolat}
            nom={t('takror.asosJadval')}
            izoh={t('takror.asosJadvalIzoh')}
            bosilganda={() => setBajarilgandan(false)}
          />
          <AsosQatori
            tanlangan={bajarilgandanHolat}
            nom={t('takror.asosBajarilgan')}
            izoh={t('takror.asosBajarilganIzoh')}
            bosilganda={() => setBajarilgandan(true)}
          />
        </div>
      </fieldset>

      {/* ---------- Har N birlik ---------- */}
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-text-muted">
          {t('takror.har')}
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={365}
            value={qoida.interval}
            onChange={(e) =>
              ozgartir({
                interval: Math.min(
                  365,
                  Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                ),
              })
            }
            aria-label={t('takror.har')}
            className="min-h-touch w-20 rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
          />
          <div className="min-w-32 flex-1">
            <Tanlagich
              ariaLabel={t('takror.har')}
              qiymat={qoida.birlik}
              onChange={(q) => ozgartir({ birlik: q as Birlik })}
              variantlar={BIRLIKLAR.map((b) => ({
                qiymat: b,
                nom: t(BIRLIK_KALITI[b]),
              }))}
            />
          </div>
        </div>
      </fieldset>

      {/* ---------- Hafta kunlari ---------- */}
      {qoida.birlik === 'hafta' && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-text-muted">
            {t('sana.kunlarniTanlang')}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {KUN_RAQAMLARI.map((kun) => (
              <Chip
                key={kun}
                tanlangan={qoida.kunlar.includes(kun)}
                bosilganda={() => kunniAlmashtir(kun)}
                ariaLabel={t(`kun.${kun}.toliq` as MatnKaliti)}
              >
                {t(`kun.${kun}.qisqa` as MatnKaliti)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {/* ---------- Oylik ---------- */}
      {qoida.birlik === 'oy' && (
        <fieldset className="mt-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Chip
              tanlangan={qoida.oyUsuli === 'sana'}
              bosilganda={() => ozgartir({ oyUsuli: 'sana' })}
            >
              {t('takror.oyUsuli.sana')}
            </Chip>
            <Chip
              tanlangan={qoida.oyUsuli === 'haftaKuni'}
              bosilganda={() =>
                ozgartir({
                  oyUsuli: 'haftaKuni',
                  haftaOrni: qoida.haftaOrni ?? 1,
                  oyHaftaKuni: qoida.oyHaftaKuni ?? 1,
                })
              }
            >
              {t('takror.oyUsuli.haftaKuni')}
            </Chip>
          </div>

          {qoida.oyUsuli === 'sana' ? (
            <>
              <div className="grid grid-cols-7 gap-1">
                {OY_KUNLARI.map((kun) => (
                  <Chip
                    key={kun}
                    tanlangan={qoida.oyKunlari.includes(kun)}
                    bosilganda={() => oyKuniniAlmashtir(kun)}
                    toliq
                  >
                    {kun}
                  </Chip>
                ))}
              </div>
              <div className="mt-1.5">
                <Chip
                  tanlangan={qoida.oyKunlari.includes(OXIRGI_KUN)}
                  bosilganda={() => ozgartir({ oyKunlari: [OXIRGI_KUN] })}
                >
                  {t('takror.oxirgiKun')}
                </Chip>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-faint">
                {qoida.oyKunlari.length > 1
                  ? t('takror.kopSanaOgoh')
                  : t('takror.uzunOyOgoh')}
              </p>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-28 flex-1">
                <Tanlagich
                  ariaLabel={t('takror.oyUsuli.haftaKuni')}
                  qiymat={String(qoida.haftaOrni ?? 1)}
                  onChange={(q) =>
                    ozgartir({ haftaOrni: Number.parseInt(q, 10) })
                  }
                  variantlar={ORINLAR.map((o) => ({
                    qiymat: String(o),
                    nom: o === OXIRGI_KUN ? t('takror.oxirgisi') : `${o}`,
                  }))}
                />
              </div>
              <div className="min-w-32 flex-1">
                <Tanlagich
                  ariaLabel={t('sana.haftaKunlari')}
                  qiymat={String(qoida.oyHaftaKuni ?? 1)}
                  onChange={(q) =>
                    ozgartir({ oyHaftaKuni: Number.parseInt(q, 10) })
                  }
                  variantlar={KUN_RAQAMLARI.map((k) => ({
                    qiymat: String(k),
                    nom: t(`kun.${k}.toliq` as MatnKaliti),
                  }))}
                />
              </div>
            </div>
          )}
        </fieldset>
      )}

      {/* ---------- Tugashi ---------- */}
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-text-muted">
          {t('takror.tugashi')}
        </legend>
        <div className="space-y-2">
          <AsosQatori
            tanlangan={qoida.tugash.tur === 'hech'}
            nom={t('takror.tugashHech')}
            bosilganda={() => ozgartir({ tugash: { tur: 'hech' } })}
          />

          <AsosQatori
            tanlangan={qoida.tugash.tur === 'sana'}
            nom={t('takror.tugashSanagacha')}
            bosilganda={() =>
              ozgartir({
                tugash: {
                  tur: 'sana',
                  sana:
                    qoida.tugash.tur === 'sana'
                      ? qoida.tugash.sana
                      : (sana ?? ''),
                },
              })
            }
          />
          {qoida.tugash.tur === 'sana' && (
            <input
              type="date"
              value={qoida.tugash.sana}
              onChange={(e) =>
                ozgartir({ tugash: { tur: 'sana', sana: e.target.value } })
              }
              aria-label={t('takror.tugashSanagacha')}
              className="min-h-touch w-full rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
            />
          )}

          <AsosQatori
            tanlangan={qoida.tugash.tur === 'marta'}
            nom={t('takror.tugashMartaTanlov')}
            bosilganda={() =>
              ozgartir({
                tugash: {
                  tur: 'marta',
                  soni: qoida.tugash.tur === 'marta' ? qoida.tugash.soni : 5,
                },
              })
            }
          />
          {qoida.tugash.tur === 'marta' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={999}
                value={qoida.tugash.soni}
                onChange={(e) =>
                  ozgartir({
                    tugash: {
                      tur: 'marta',
                      soni: Math.min(
                        999,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                      ),
                    },
                  })
                }
                aria-label={t('takror.tugashMartaTanlov')}
                className="min-h-touch w-24 rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
              />
              <span className="text-sm text-text-muted">
                {t('takror.martaBirlik')}
              </span>
            </div>
          )}

          {martaChek && (
            <p className="text-xs leading-relaxed text-danger">
              {t('takror.martaChek')}
            </p>
          )}
        </div>
      </fieldset>

      {/* ---------- Natija ---------- */}
      <div className="mt-5 rounded-xl bg-brand-soft px-4 py-3">
        <p className="text-xs font-medium text-text-muted">
          {t('takror.xulosa')}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-brand-onsoft">
          {xulosa}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={yop}
          className="min-h-touch flex-1 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
        >
          {t('umumiy.bekor')}
        </button>
        <button
          type="button"
          disabled={martaChek}
          onClick={() => onSaqla(natija, bajarilgandanHolat)}
          className="min-h-touch flex-1 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {t('umumiy.saqlash')}
        </button>
      </div>
    </Oyna>
  )
}

/** Oyna birinchi marta ochilganda — vazifa sanasiga mos qoida */
function boshlangich(sana: string | null): TakrorQoidasi {
  if (!sana) return BOSH_QOIDA
  const kun = Number.parseInt(sana.slice(8, 10), 10)
  return {
    ...BOSH_QOIDA,
    birlik: 'oy',
    oyUsuli: 'sana',
    oyKunlari: Number.isInteger(kun) ? [kun] : [],
  }
}

/** Radio o'rnidagi bosiladigan qator */
function AsosQatori({
  tanlangan,
  nom,
  izoh,
  bosilganda,
}: {
  tanlangan: boolean
  nom: string
  izoh?: string
  bosilganda: () => void
}) {
  return (
    <button
      type="button"
      onClick={bosilganda}
      aria-pressed={tanlangan}
      className={`flex w-full min-h-0 items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
        tanlangan
          ? 'border-brand-onsoft bg-brand-soft'
          : 'border-border-subtle hover:bg-surface-muted'
      }`}
    >
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
          tanlangan ? 'border-brand-onsoft' : 'border-border-control'
        }`}
      >
        {tanlangan && (
          <span className="size-2 rounded-full bg-brand-onsoft" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium ${
            tanlangan ? 'text-brand-onsoft' : 'text-text-strong'
          }`}
        >
          {nom}
        </span>
        {izoh && (
          <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
            {izoh}
          </span>
        )}
      </span>
    </button>
  )
}

function Chip({
  tanlangan,
  bosilganda,
  children,
  ariaLabel,
  toliq = false,
}: {
  tanlangan: boolean
  bosilganda: () => void
  children: React.ReactNode
  ariaLabel?: string
  toliq?: boolean
}) {
  return (
    <button
      type="button"
      onClick={bosilganda}
      aria-pressed={tanlangan}
      aria-label={ariaLabel}
      className={`min-h-0 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
        toliq ? 'w-full' : 'min-w-9'
      } ${
        tanlangan
          ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
          : 'border-border-subtle text-text-muted hover:bg-surface-muted'
      }`}
    >
      {children}
    </button>
  )
}
