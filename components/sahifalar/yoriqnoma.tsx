'use client'

import { useState } from 'react'
import {
  AlignLeft,
  BarChart3,
  BellRing,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CloudOff,
  Download,
  FolderKanban,
  FolderOpen,
  Keyboard,
  Moon,
  Play,
  Send,
  Settings,
  Sun,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { useT } from '@/components/app/til-provayder'
import { useTanishuv } from '@/components/tanishuv/tanishuv-provayder'
import { DARSLAR, panelFaol, tabrikKorilgan } from '@/lib/tanishuv'

/**
 * To'liq yo'riqnoma.
 *
 * Oldin bu yerda oltita bir qatorli maslahat bor edi ("Papka
 * oching", "Vazifa yozing"...) — ular nima qilishni aytardi, lekin
 * QANDAY qilishni va har bir bo'lim nimaga kerakligini emas. Odam
 * o'qib chiqqach ham ilovani tushunmasdi.
 *
 * Nega skrinshot emas, chizma: skrinshot interfeys har
 * o'zgarganda eskiradi va uni yangilash esdan chiqadi — natijada
 * yo'riqnoma yolg'on ma'lumot bera boshlaydi. Bu yerdagi sodda
 * chizmalar esa ilovaning o'z ranglarida, ikkala mavzuda ham
 * to'g'ri ko'rinadi va tushuntirish bilan birga o'zgaradi.
 */

/**
 * Yo'riqnomadagi ekran surati.
 *
 * Fayl topilmasa HECH NARSA ko'rsatmaydi: suratlar ketma-ket,
 * tayyor bo'lgani sari qo'shib boriladi va yo'riqnoma shu orada
 * ham to'g'ri ko'rinib turadi. Aks holda "rasm yuklanmadi"
 * belgisi chiqib, hujjat tashlandiq ko'rinardi.
 */
function Rasm({ manba, izoh }: { manba: string; izoh?: string }) {
  const [xato, setXato] = useState(false)
  if (xato) return null
  return (
    <figure className="mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- o'lchami oldindan noma'lum ekran surati */}
      <img
        src={manba}
        alt={izoh ?? ''}
        loading="lazy"
        onError={() => setXato(true)}
        className="w-full rounded-xl border border-border-subtle bg-surface-muted"
      />
      {izoh && (
        <figcaption className="mt-1.5 text-xs leading-relaxed text-text-faint">
          {izoh}
        </figcaption>
      )}
    </figure>
  )
}

type Bolim = {
  kalit: string
  ikonka: typeof Play
  sarlavha: string
  qisqa: string
  /**
   * Ekran surati — `public/yoriqnoma/` ichida.
   *
   * Fayl yo'q bo'lsa hech narsa ko'rinmaydi (pastdagi `Rasm`
   * komponentiga qarang), shuning uchun suratlar ketma-ket,
   * tayyor bo'lgani sari qo'shib borilaveradi.
   */
  rasm?: string
  /** Rasm ostidagi izoh — nimaga e'tibor berish kerakligi */
  rasmIzoh?: string
  /** Ochilganda ko'rinadigan batafsil tushuntirish */
  tafsilot: { sarlavha: string; matn: string }[]
}

/*
  Matn qoidasi: har bo'lim — bir qatorlik "nima bu" va 1–4 ta qisqa
  band. Faqat odam bilishi KERAK bo'lgan narsa; qolganini ilovaning
  o'zi (tanishuv darslari, maslahatlar) ko'rsatib beradi.
*/
const BOLIMLAR: Bolim[] = [
  {
    kalit: 'jarayonda',
    ikonka: Play,
    sarlavha: 'Jarayonda',
    qisqa: 'Hozir qilayotgan ishingiz.',
    rasm: '/yoriqnoma/jarayonda.png',
    rasmIzoh: 'Boshlangan ishlar sariq chiziq bilan ajralib turadi.',
    tafsilot: [
      { sarlavha: 'Qanday', matn: 'Vazifadagi ▶ ni bosing — u shu yerga o‘tadi. Tugatgach doirachani bosing.' },
      { sarlavha: 'Maslahat', matn: 'Bir vaqtda bitta ish — tezroq tugaydi.' },
    ],
  },
  {
    kalit: 'bugun',
    ikonka: Sun,
    sarlavha: 'Bugun',
    qisqa: 'Bugungi va kechikkan ishlar.',
    rasm: '/yoriqnoma/bugun.png',
    rasmIzoh: 'Kechikkanlar tepada, bugungilar o‘rtada, bajarilganlar pastda.',
    tafsilot: [
      { sarlavha: 'Tartib', matn: 'Kechikkan (qizil) — tepada, bugungi — o‘rtada, bajarilgan — pastda.' },
      { sarlavha: 'Maslahat', matn: 'Keraksiz ishni o‘chiring yoki sanasini suring — ro‘yxat toza tursin.' },
    ],
  },
  {
    kalit: 'kelgusi',
    ikonka: CalendarDays,
    sarlavha: 'Kelgusi',
    qisqa: 'Oldindagi ishlar, kunma-kun.',
    tafsilot: [
      { sarlavha: 'Nima uchun', matn: 'Qaysi kun bo‘sh, qaysi kun band — bir qarashda ko‘rasiz.' },
    ],
  },
  {
    kalit: 'korish',
    ikonka: CircleCheck,
    sarlavha: 'Ko‘rish',
    qisqa: 'Hammasi bir sahifada.',
    tafsilot: [
      { sarlavha: 'Ichida', matn: 'Asosiy sonlar, papkalar, loyihalar, kechki reja, hisobot va sozlamalar.' },
    ],
  },
  {
    kalit: 'vazifa',
    ikonka: CircleCheck,
    sarlavha: 'Vazifa',
    qisqa: 'Sana, vaqt, takror, muhimlik, foiz va ichki ishlar.',
    rasm: '/yoriqnoma/vazifa.png',
    rasmIzoh: 'Vazifa oynasi: nom, izoh, sana, muhimlik va foiz.',
    tafsilot: [
      { sarlavha: 'Sana va vaqt', matn: '«Sana tanlash» → Bugun, Ertaga yoki kalendar. Vaqt qo‘ysangiz — eslatma keladi.' },
      { sarlavha: 'Takror', matn: 'Har kuni, har hafta, har oy yoki o‘zingiz tanlagan kunlar. Bajarilgach o‘zi keyingi sanaga o‘tadi.' },
      { sarlavha: 'Muhimlik', matn: 'P1 — eng muhim, P4 — oddiy. Muhimlari tepada turadi.' },
      { sarlavha: 'Foiz va ichki ishlar', matn: 'Uzoq ishni foiz bilan davom ettiring (100% — bajarildi) yoki kichik qadamlarga bo‘ling.' },
    ],
  },
  {
    kalit: 'kalit-sozlar',
    ikonka: Keyboard,
    sarlavha: 'Tez yozish',
    qisqa: 'Nomga «ertaga 9», «har kuni», «p1» deb yozing — ilova o‘zi tushunadi.',
    rasm: '/yoriqnoma/kalit-sozlar.png',
    rasmIzoh: 'Tanilgan so‘z rang bilan belgilanadi.',
    tafsilot: [
      { sarlavha: 'Misollar', matn: '«Hisobot ertaga 9», «To‘lov har 15», «Dars har se», «Muhim ish p1».' },
      { sarlavha: 'Xato tanisa', matn: 'Rangli so‘zni bir bosing — oddiy matnga aylanadi.' },
    ],
  },
  {
    kalit: 'izoh',
    ikonka: AlignLeft,
    sarlavha: 'Izoh',
    qisqa: 'Nom ostidagi qo‘shimcha ma’lumot.',
    rasm: '/yoriqnoma/izoh.png',
    rasmIzoh: 'Izoh ro‘yxatda nom ostida ko‘rinadi.',
    tafsilot: [
      { sarlavha: 'Nima yoziladi', matn: 'Manzil, telefon, havola yoki qadamlar. Havolani ro‘yxatdan turib ochsa bo‘ladi.' },
    ],
  },
  {
    kalit: 'papkalar',
    ikonka: FolderOpen,
    sarlavha: 'Papkalar',
    qisqa: 'Ishlarni turiga qarab ajrating.',
    rasm: '/yoriqnoma/papkalar.png',
    rasmIzoh: 'Yon paneldagi papkalar ro‘yxati.',
    tafsilot: [
      { sarlavha: 'Papka', matn: 'Ish, O‘qish, Uy… «Kiruvchi» — tez yozib qo‘yish joyi.' },
      { sarlavha: 'Bo‘lim', matn: 'Papka ichidagi kichik guruh: «Uchrashuvlar», «Hisobotlar».' },
    ],
  },
  {
    kalit: 'loyihalar',
    ikonka: FolderKanban,
    sarlavha: 'Loyihalar',
    qisqa: 'Har bir bo‘lim — alohida loyiha, bajarilish foizi bilan.',
    rasm: '/yoriqnoma/loyihalar.png',
    rasmIzoh: 'Loyihalar holat bo‘yicha uch guruhga bo‘linadi.',
    tafsilot: [
      { sarlavha: 'Qachon', matn: 'Boshi va oxiri bor katta ishlar uchun: «Sayt», «Imtihonga tayyorgarlik».' },
    ],
  },
  {
    kalit: 'kechki',
    ikonka: Moon,
    sarlavha: 'Kechki reja',
    qisqa: 'Ertangi kunni kechqurun rejalang.',
    tafsilot: [
      { sarlavha: 'Qanday', matn: 'Kechqurun ishlarni yozing — ular ertangi kunga tushadi. Ertalab tayyor rejadan boshlaysiz.' },
    ],
  },
  {
    kalit: 'hisobot',
    ikonka: BarChart3,
    sarlavha: 'Hisobot',
    qisqa: 'Qancha ish qildingiz — kun, hafta, oy.',
    rasm: '/yoriqnoma/hisobot.png',
    rasmIzoh: 'Davrni tanlang, kartani bossangiz ro‘yxat ochiladi.',
    tafsilot: [
      { sarlavha: 'Maslahat', matn: 'Haftada bir qarang: qaysi papkada ish to‘planib qolyapti?' },
    ],
  },
  {
    kalit: 'topshiriqlar',
    ikonka: Send,
    sarlavha: 'Topshiriqlar',
    qisqa: 'Boshqa odamga ish yuboring va bajarilishini kuzating.',
    rasm: '/yoriqnoma/topshiriqlar.png',
    rasmIzoh: 'Topshiriq kartasi: kimdan, muddat va holat.',
    tafsilot: [
      { sarlavha: 'Yuborish', matn: '«Yuborish» → kimga, nima, muddat. Faqat Samara foydalanuvchisiga.' },
      { sarlavha: 'Qabul qiluvchi', matn: 'Topshiriq uning Kiruvchi papkasiga tushadi. Tugatgach natijani yozib topshiradi.' },
      { sarlavha: 'Fikrlar', matn: 'Topshiriq ichidagi suhbat: savol, fayl, reaksiya.' },
      { sarlavha: 'Tekshiruv', matn: 'Natijani qabul qilasiz yoki qayta ishlashga qaytarasiz.' },
    ],
  },
  {
    kalit: 'offline',
    ikonka: CloudOff,
    sarlavha: 'Internetsiz',
    qisqa: 'Aloqa bo‘lmasa ham ishlayverasiz.',
    rasm: '/yoriqnoma/offline.png',
    rasmIzoh: 'Internet yo‘qolganda yuqorida kulrang chiziq chiqadi.',
    tafsilot: [
      { sarlavha: 'Ishlaydi', matn: 'Vazifa qo‘shish, tahrirlash, bajarish. Internet qaytgach o‘zi saqlanadi.' },
      { sarlavha: 'Ishlamaydi', matn: 'Kirish, topshiriq yuborish va boshqa qurilmadagi yangiliklar.' },
    ],
  },
  {
    kalit: 'sozlamalar',
    ikonka: Settings,
    sarlavha: 'Sozlamalar',
    qisqa: 'Profil, til, mavzu, menyu tartibi, bildirishnoma.',
    tafsilot: [
      { sarlavha: 'Muhim', matn: 'Vaqt mintaqasi to‘g‘ri bo‘lsin — eslatmalar shu bo‘yicha keladi.' },
    ],
  },
]

const QOSHIMCHA = [
  {
    ikonka: BellRing,
    sarlavha: 'Eslatma kelishi uchun',
    matn: 'Vazifaga vaqt qo‘ying va bildirishnomaga ruxsat bering.',
  },
  {
    ikonka: Download,
    sarlavha: 'Telefonga o‘rnatish',
    matn: 'Android: «O‘rnatish» tugmasi. iPhone: Safari → Ulashish → «Bosh ekranga qo‘shish».',
  },
]

/**
 * Yo'riqnomaning o'zi — sahifa o'ramisiz.
 *
 * Alohida ajratilgan, chunki u ikki joyda ko'rinadi: `/yoriqnoma`
 * sahifasida va Sozlamalar ichidagi bo'limda. Ikki nusxa yozilsa,
 * ular asta-sekin bir-biridan farq qila boshlardi.
 */
export function YoriqnomaMazmuni() {
  // Hammasi yopiq: ro'yxat qisqa ko'rinsin, odam keraklisini o'zi ochsin
  const [ochiq, setOchiq] = useState<string | null>(null)

  return (
    <>
      <TanishuvKartasi />

      <p className="mb-6 rounded-2xl bg-brand-soft px-5 py-4 text-sm leading-relaxed text-text-strong">
        <strong>Yozing → sana qo‘ying → boshlang → bajaring.</strong>{' '}
        Batafsil bilish uchun bo‘limni bosing.
      </p>

      <ul className="space-y-2">
        {BOLIMLAR.map((b) => {
          const yoyilgan = ochiq === b.kalit
          return (
            <li
              key={b.kalit}
              className="overflow-hidden rounded-2xl bg-surface shadow-card"
            >
              <button
                type="button"
                onClick={() => setOchiq(yoyilgan ? null : b.kalit)}
                aria-expanded={yoyilgan}
                className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-surface-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                  <b.ikonka className="size-5 text-brand-onsoft" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-text-strong">
                    {b.sarlavha}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-text-muted">
                    {b.qisqa}
                  </span>
                </span>
                <ChevronDown
                  className={`mt-1 size-5 shrink-0 text-text-faint transition ${
                    yoyilgan ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>

              {yoyilgan && (
                <div className="border-t border-border-subtle px-4 py-3 sm:pl-18">
                  {b.rasm && <Rasm manba={b.rasm} izoh={b.rasmIzoh} />}
                  <dl className="space-y-3">
                    {b.tafsilot.map((d) => (
                      <div key={d.sarlavha}>
                        <dt className="text-sm font-semibold text-text-strong">
                          {d.sarlavha}
                        </dt>
                        <dd className="mt-0.5 text-sm leading-relaxed text-text-muted">
                          {d.matn}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <h2 className="mt-8 mb-3 px-1 text-sm font-semibold text-text-muted">
        Ko‘p so‘raladigan savollar
      </h2>
      <ul className="space-y-2">
        {QOSHIMCHA.map((q) => (
          <li
            key={q.sarlavha}
            className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-card"
          >
            <q.ikonka
              className="mt-0.5 size-5 shrink-0 text-brand-onsoft"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-strong">{q.sarlavha}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
                {q.matn}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export function YoriqnomaKorinishi() {
  return (
    <Sahifa
      sarlavha="Yo‘riqnoma"
      tavsif="Har bir bo‘lim nima qilishi va qanday ishlatilishi"
    >
      <YoriqnomaMazmuni />
    </Sahifa>
  )
}

/**
 * Tanishuvni qayta boshlash yoki to'xtagan joyidan davom ettirish.
 * Eski foydalanuvchilarga kutib olish chiqmaydi — ular shu yerdan
 * istagan payt ko'rib chiqa oladi.
 */
function TanishuvKartasi() {
  const t = useT()
  const tanishuv = useTanishuv()
  if (!tanishuv) return null
  const { holat, saqla, qaytaBoshlash } = tanishuv
  const davomEtsaBoladi = Boolean(holat?.papkaId && !tabrikKorilgan(holat) && holat.yopilgan)

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-amber-300/60 bg-amber-400/10 p-5 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl" aria-hidden>
        🎓
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-strong">{t('tanishuv.yoriqnoma.s')}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{t('tanishuv.yoriqnoma.m', { n: DARSLAR.length })}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {davomEtsaBoladi && (
          <button
            type="button"
            onClick={() => saqla({ yopilgan: false })}
            className="cursor-pointer rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            {t('tanishuv.yoriqnoma.davom')}
          </button>
        )}
        {!panelFaol(holat) && (
          <button
            type="button"
            onClick={() => {
              qaytaBoshlash()
              window.scrollTo({ top: 0 })
            }}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              davomEtsaBoladi
                ? 'bg-surface text-text-strong hover:bg-surface-muted'
                : 'bg-brand-primary text-white hover:bg-brand-primary-hover'
            }`}
          >
            {t('tanishuv.yoriqnoma.boshla')}
          </button>
        )}
      </div>
    </div>
  )
}
