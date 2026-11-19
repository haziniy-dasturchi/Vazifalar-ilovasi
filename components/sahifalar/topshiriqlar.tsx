'use client'

import { useState } from 'react'
import {
  Check,
  Clock,
  Inbox,
  Send,
  ThumbsDown,
  Trash2,
  X,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { Oyna } from '@/components/ui/oyna'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import {
  useKelganTopshiriqlar,
  useTavsiyaEmaillar,
  useTopshiriqBekor,
  useTopshiriqQabul,
  useTopshiriqRad,
  useTopshiriqYuborish,
  useYuborilganTopshiriqlar,
} from '@/lib/queries/topshiriqlar'
import { toliqSana } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'
import type { TaskPriority, Topshiriq, TopshiriqHolati } from '@/types/vazifalar'

/** Email shakli — bazadagi CHECK bilan bir xil mantiq */
const EMAIL_SHAKLI = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const HOLAT_KALITI: Record<TopshiriqHolati, MatnKaliti> = {
  kutilmoqda: 'topshiriq.holat.kutilmoqda',
  qabul: 'topshiriq.holat.qabul',
  rad: 'topshiriq.holat.rad',
  bajarildi: 'topshiriq.holat.bajarildi',
}

const HOLAT_RANGI: Record<TopshiriqHolati, string> = {
  kutilmoqda: 'var(--text-muted)',
  qabul: 'var(--status-progress-line)',
  rad: 'var(--danger)',
  bajarildi: 'var(--brand-accent)',
}

export function TopshiriqlarKorinishi() {
  const t = useT()
  const [tab, setTab] = useState<'kelgan' | 'yuborilgan'>('kelgan')
  const [yuborishOchiq, setYuborishOchiq] = useState(false)

  const kelgan = useKelganTopshiriqlar()
  const yuborilgan = useYuborilganTopshiriqlar()

  const kutilayotgan =
    kelgan.data?.filter((x) => x.holat === 'kutilmoqda').length ?? 0

  return (
    <Sahifa
      sarlavha={t('topshiriq.bolimi')}
      harakat={
        <button
          type="button"
          onClick={() => setYuborishOchiq(true)}
          className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <Send className="size-4" aria-hidden />
          {t('topshiriq.yangi')}
        </button>
      }
    >
      <div
        role="tablist"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1"
      >
        {(['kelgan', 'yuborilgan'] as const).map((k) => {
          const tanlangan = tab === k
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tanlangan}
              onClick={() => setTab(k)}
              className={`flex min-h-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tanlangan
                  ? 'bg-surface text-text-strong shadow-card'
                  : 'text-text-muted hover:text-text-strong'
              }`}
            >
              {t(k === 'kelgan' ? 'topshiriq.kelgan' : 'topshiriq.yuborilgan')}
              {k === 'kelgan' && kutilayotgan > 0 && (
                <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {kutilayotgan}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'kelgan' ? (
        kelgan.isPending ? (
          <Yuklanmoqda qator={2} />
        ) : kelgan.isError ? (
          <XatoHolati qayta={() => kelgan.refetch()} />
        ) : kelgan.data.length === 0 ? (
          <BoshHolat
            ikonka={Inbox}
            sarlavha={t('topshiriq.boshKelgan')}
            matn={t('topshiriq.boshKelganMatn')}
          />
        ) : (
          <ul className="space-y-3">
            {kelgan.data.map((x) => (
              <KelganKarta key={x.id} topshiriq={x} />
            ))}
          </ul>
        )
      ) : yuborilgan.isPending ? (
        <Yuklanmoqda qator={2} />
      ) : yuborilgan.isError ? (
        <XatoHolati qayta={() => yuborilgan.refetch()} />
      ) : yuborilgan.data.length === 0 ? (
        <BoshHolat
          ikonka={Send}
          sarlavha={t('topshiriq.boshYuborilgan')}
          matn={t('topshiriq.boshYuborilganMatn')}
        />
      ) : (
        <ul className="space-y-3">
          {yuborilgan.data.map((x) => (
            <YuborilganKarta key={x.id} topshiriq={x} />
          ))}
        </ul>
      )}

      {yuborishOchiq && (
        <YuborishOynasi yop={() => setYuborishOchiq(false)} />
      )}
    </Sahifa>
  )
}

function HolatBelgisi({ holat }: { holat: TopshiriqHolati }) {
  const t = useT()
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        color: HOLAT_RANGI[holat],
        backgroundColor: 'var(--surface-muted)',
      }}
    >
      {t(HOLAT_KALITI[holat])}
    </span>
  )
}

// =============================================================
// Menga kelgan topshiriq
// =============================================================
function KelganKarta({ topshiriq }: { topshiriq: Topshiriq }) {
  const t = useT()
  const { korsat } = useToast()
  const qabul = useTopshiriqQabul()
  const rad = useTopshiriqRad()
  const [radOchiq, setRadOchiq] = useState(false)
  const [sabab, setSabab] = useState('')

  const javobBerilmagan = topshiriq.holat === 'kutilmoqda'

  async function qabulQil() {
    try {
      await qabul.mutateAsync(topshiriq.id)
      korsat({ matn: t('topshiriq.qabulQilindi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  async function radEt() {
    try {
      await rad.mutateAsync({ id: topshiriq.id, sabab })
      setRadOchiq(false)
      setSabab('')
      korsat({ matn: t('topshiriq.radEtildi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <li className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 font-semibold text-text-strong">
          {topshiriq.sarlavha}
        </p>
        <HolatBelgisi holat={topshiriq.holat} />
      </div>

      {topshiriq.izoh && (
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
          {topshiriq.izoh}
        </p>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {toliqSana(topshiriq.created_at.slice(0, 10))}
        </span>
        {topshiriq.muddat && (
          <span>
            {t('topshiriq.muddat')}: {toliqSana(topshiriq.muddat)}
          </span>
        )}
      </p>

      {topshiriq.holat === 'rad' && topshiriq.rad_sababi && (
        <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {topshiriq.rad_sababi}
        </p>
      )}

      {javobBerilmagan && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={qabulQil}
            disabled={qabul.isPending}
            className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {t('topshiriq.qabul')}
          </button>
          <button
            type="button"
            onClick={() => setRadOchiq(true)}
            className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
          >
            <X className="size-4" aria-hidden />
            {t('topshiriq.rad')}
          </button>
        </div>
      )}

      {radOchiq && (
        <Oyna sarlavha={t('topshiriq.radSababi')} yop={() => setRadOchiq(false)}>
          <OsuvchiMaydon
            qiymat={sabab}
            onChange={setSabab}
            placeholder={t('topshiriq.radSababiJoy')}
            ariaLabel={t('topshiriq.radSababi')}
            maxLength={1000}
            autoFocus
            engKattaBalandlik={180}
            className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRadOchiq(false)}
              className="min-h-touch rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
            >
              {t('umumiy.bekor')}
            </button>
            <button
              type="button"
              onClick={radEt}
              disabled={rad.isPending}
              className="flex min-h-touch items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              <ThumbsDown className="size-4" aria-hidden />
              {t('topshiriq.radYubor')}
            </button>
          </div>
        </Oyna>
      )}
    </li>
  )
}

// =============================================================
// Men yuborgan topshiriq — holatini kuzatish
// =============================================================
function YuborilganKarta({ topshiriq }: { topshiriq: Topshiriq }) {
  const t = useT()
  const { korsat } = useToast()
  const bekor = useTopshiriqBekor()
  const [bekorOchiq, setBekorOchiq] = useState(false)

  return (
    <li className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">{topshiriq.sarlavha}</p>
          <p className="mt-0.5 truncate text-sm text-text-muted">
            {topshiriq.qabul_qiluvchi_email}
          </p>
        </div>
        <HolatBelgisi holat={topshiriq.holat} />
      </div>

      {topshiriq.holat === 'rad' && topshiriq.rad_sababi && (
        <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {topshiriq.rad_sababi}
        </p>
      )}

      <p className="mt-2 text-xs text-text-faint">
        {toliqSana(topshiriq.created_at.slice(0, 10))}
      </p>

      {/* Javob kelmaguncha bekor qilish mumkin */}
      {topshiriq.holat === 'kutilmoqda' && (
        <button
          type="button"
          onClick={() => setBekorOchiq(true)}
          className="mt-3 flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-danger transition hover:bg-danger-soft"
        >
          <Trash2 className="size-4" aria-hidden />
          {t('topshiriq.bekor')}
        </button>
      )}

      {bekorOchiq && (
        <Tasdiq
          sarlavha={t('topshiriq.bekor')}
          matn={topshiriq.sarlavha}
          tasdiqla={async () => {
            try {
              await bekor.mutateAsync(topshiriq.id)
              setBekorOchiq(false)
              korsat({
                matn: t('topshiriq.bekorQilindi'),
                tone: 'muvaffaqiyat',
              })
            } catch {
              korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
            }
          }}
          yop={() => setBekorOchiq(false)}
          bajarilmoqda={bekor.isPending}
        />
      )}
    </li>
  )
}

// =============================================================
// Yuborish oynasi
// =============================================================
function YuborishOynasi({ yop }: { yop: () => void }) {
  const t = useT()
  const { korsat } = useToast()
  const { email: ozEmail } = useFoydalanuvchi()
  const yuborish = useTopshiriqYuborish()
  const tavsiyalar = useTavsiyaEmaillar()

  const [email, setEmail] = useState('')
  const [sarlavha, setSarlavha] = useState('')
  const [izoh, setIzoh] = useState('')
  const [muddat, setMuddat] = useState('')
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(4)

  const toza = email.trim().toLowerCase()
  const emailTogri = EMAIL_SHAKLI.test(toza)
  const ozigami = toza === ozEmail.toLowerCase()
  const toliq = emailTogri && !ozigami && sarlavha.trim().length > 0

  // Yozilayotgan matnga mos keladigan oldingi manzillar
  const moslar = tavsiyalar
    .filter((e) => e !== toza && (toza === '' || e.includes(toza)))
    .slice(0, 4)

  async function yubor() {
    if (!toliq || yuborish.isPending) return
    try {
      await yuborish.mutateAsync({
        qabul_qiluvchi_email: toza,
        sarlavha,
        izoh,
        muddat: muddat || null,
        muhimlik,
      })
      korsat({ matn: t('topshiriq.yuborildi'), tone: 'muvaffaqiyat' })
      yop()
    } catch {
      korsat({ matn: t('topshiriq.yuborilmadi'), tone: 'xato' })
    }
  }

  return (
    <Oyna sarlavha={t('topshiriq.yangi')} yop={yop}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          yubor()
        }}
      >
        <label className="mb-1.5 block text-sm font-medium text-text-muted">
          {t('topshiriq.kimga')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('topshiriq.kimgaJoy')}
          autoFocus
          maxLength={200}
          className="min-h-touch w-full rounded-xl border border-border-control bg-surface px-4 text-base text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />

        {/* Avval yuborilgan manzillar — qayta yozish shart emas */}
        {moslar.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs text-text-faint">
              {t('topshiriq.tavsiyalar')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {moslar.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmail(e)}
                  className="min-h-0 rounded-full border border-border-subtle px-3 py-1 text-xs text-text-muted transition hover:bg-surface-muted hover:text-text-strong"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {toza !== '' && !emailTogri && (
          <p className="mt-1.5 text-sm text-danger">
            {t('topshiriq.emailNotogri')}
          </p>
        )}
        {ozigami && (
          <p className="mt-1.5 text-sm text-danger">
            {t('topshiriq.ozigaBolmaydi')}
          </p>
        )}

        <label className="mt-5 mb-1.5 block text-sm font-medium text-text-muted">
          {t('topshiriq.sarlavha')}
        </label>
        <OsuvchiMaydon
          qiymat={sarlavha}
          onChange={setSarlavha}
          onEnter={yubor}
          placeholder={t('vazifa.nomiJoy')}
          ariaLabel={t('topshiriq.sarlavha')}
          maxLength={500}
          engKattaBalandlik={160}
          className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />

        <label className="mt-5 mb-1.5 block text-sm font-medium text-text-muted">
          {t('topshiriq.izoh')}
        </label>
        <OsuvchiMaydon
          qiymat={izoh}
          onChange={setIzoh}
          placeholder={t('topshiriq.izohJoy')}
          ariaLabel={t('topshiriq.izoh')}
          maxLength={2000}
          engKattaBalandlik={180}
          className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="topshiriq-muddat"
              className="mb-1.5 block text-sm font-medium text-text-muted"
            >
              {t('topshiriq.muddat')}
            </label>
            <input
              id="topshiriq-muddat"
              type="date"
              value={muddat}
              onChange={(e) => setMuddat(e.target.value)}
              className="min-h-touch rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-text-muted">
              {t('vazifa.muhimlik')}
            </p>
            <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} ixcham />
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-text-muted">
          {t('topshiriq.yuborishIzohi')}
        </p>

        <button
          type="submit"
          disabled={!toliq || yuborish.isPending}
          className="mt-5 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden />
          {yuborish.isPending ? t('umumiy.kuting') : t('topshiriq.yubor')}
        </button>
      </form>
    </Oyna>
  )
}
