'use client'

import { useState } from 'react'
import {
  BarChart3,
  BellRing,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CloudOff,
  Download,
  FolderKanban,
  FolderOpen,
  Gauge,
  Moon,
  Play,
  Repeat2,
  Settings,
  Sun,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'

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

type Bolim = {
  kalit: string
  ikonka: typeof Play
  sarlavha: string
  qisqa: string
  /** Ochilganda ko'rinadigan batafsil tushuntirish */
  tafsilot: { sarlavha: string; matn: string }[]
}

const BOLIMLAR: Bolim[] = [
  {
    kalit: 'jarayonda',
    ikonka: Play,
    sarlavha: 'Jarayonda',
    qisqa: 'Hozir ustida ishlayotgan ishingiz. Ilova shu sahifadan ochiladi.',
    tafsilot: [
      {
        sarlavha: 'Nima uchun kerak',
        matn: 'Bir vaqtda o‘nta ishni o‘ylash o‘rniga bittasiga jamlanish uchun. Boshlangan vazifa shu yerda alohida turadi — “nima qilishim kerak?” degan savol bir bosishda hal bo‘ladi.',
      },
      {
        sarlavha: 'Qanday ishlatiladi',
        matn: 'Hech narsa boshlanmagan bo‘lsa, shu sahifaning o‘zida bugungi ishlar ro‘yxati chiqadi. Istaganingizning yonidagi ▶ tugmasini bosing — u “jarayonda” holatiga o‘tadi.',
      },
      {
        sarlavha: 'Maslahat',
        matn: 'Bir vaqtda bittadan ortiq ishni boshlash mumkin, lekin tavsiya etilmaydi: diqqat bo‘linganda ikkala ish ham sekinlashadi.',
      },
    ],
  },
  {
    kalit: 'bugun',
    ikonka: Sun,
    sarlavha: 'Bugun',
    qisqa: 'Bugunga rejalangan va kechikkan ishlar.',
    tafsilot: [
      {
        sarlavha: 'Uch guruh',
        matn: 'Kechikkan (qizil) — muddati o‘tgan ishlar, ular eng tepada turadi. Bugun — bugunga belgilangan ishlar. Bajarildi — bugun tugatganlaringiz.',
      },
      {
        sarlavha: 'Kechikkanlar nega tepada',
        matn: 'Ular ko‘proq e’tibor talab qiladi. Agar ish endi kerak bo‘lmasa, uni o‘chiring yoki sanasini surib qo‘ying — ro‘yxat toza qolsin.',
      },
    ],
  },
  {
    kalit: 'kelgusi',
    ikonka: CalendarDays,
    sarlavha: 'Kelgusi',
    qisqa: 'Oldinda turgan ishlar, sana bo‘yicha guruhlangan.',
    tafsilot: [
      {
        sarlavha: 'Nima uchun kerak',
        matn: 'Haftani oldindan ko‘rish uchun: qaysi kun bo‘sh, qaysi kun to‘lib ketgan. Shu bilan ishni tekis taqsimlaysiz.',
      },
    ],
  },
  {
    kalit: 'korish',
    ikonka: CircleCheck,
    sarlavha: 'Ko‘rish',
    qisqa: 'Umumiy manzara: sonlar, bo‘limlar va papkalar ro‘yxati.',
    tafsilot: [
      {
        sarlavha: 'Yuqoridagi to‘rtta son',
        matn: 'Jarayonda, bajarildi, qoldi va kechikkan. Har biriga bosib o‘sha ro‘yxatga o‘tasiz.',
      },
      {
        sarlavha: 'Pastda',
        matn: 'Kechki reja, hisobot, yo‘riqnoma va sozlamalarga o‘tish, so‘ng loyihalar va papkalar ro‘yxati.',
      },
    ],
  },
  {
    kalit: 'vazifa',
    ikonka: CircleCheck,
    sarlavha: 'Vazifa qanday tuziladi',
    qisqa: 'Sana, vaqt, takrorlanish, muhimlik, bajarilish foizi va ichki ishlar.',
    tafsilot: [
      {
        sarlavha: 'Sana va vaqt',
        matn: '“Sana tanlash” tugmasini bosing. Tayyor variantlar — Bugun, Ertaga, Keyingi hafta, Dam olish — yoki kalendardan istalgan kunni tanlang. Vaqt qo‘ysangiz, o‘sha paytda telefoningizga eslatma keladi.',
      },
      {
        sarlavha: 'Takrorlanish',
        matn: 'Har kuni, ish kunlari, har hafta, har oy — yoki o‘zingiz kunlarni belgilaysiz. Masalan har seshanba, chorshanba va payshanba. Vazifa bajarilgach o‘zi keyingi sanaga ko‘chadi.',
      },
      {
        sarlavha: 'Muhimlik (P1–P4)',
        matn: 'P1 — eng muhim, P4 — oddiy (sukut bo‘yicha). Ro‘yxatda muhimroq ishlar tepada turadi.',
      },
      {
        sarlavha: 'Bajarilish foizi',
        matn: 'Bir kunda tugamaydigan ish uchun: bugun 50% deb belgilab qo‘ying, ertaga o‘sha joydan davom ettirasiz. 100% qo‘yilsa vazifa bajarildi hisoblanadi.',
      },
      {
        sarlavha: 'Ichki ishlar (subtask)',
        matn: 'Katta vazifani kichik qadamlarga bo‘ling. Ularning nechtasi bajarilgani ota-vazifa yonida ko‘rinadi.',
      },
    ],
  },
  {
    kalit: 'papkalar',
    ikonka: FolderOpen,
    sarlavha: 'Papkalar va bo‘limlar',
    qisqa: 'Ishlaringizni turi bo‘yicha ajratish.',
    tafsilot: [
      {
        sarlavha: 'Papka',
        matn: 'Katta guruh: Ish, O‘qish, Uy. Har biriga o‘z rangi va belgisini berasiz. “Kiruvchi” papkasi hammada bor — shoshilinch yozib qo‘yiladigan joy, keyin uni kerakli papkaga ko‘chirasiz.',
      },
      {
        sarlavha: 'Bo‘lim',
        matn: 'Papka ichidagi kichikroq guruh. Masalan “Ish” papkasida “Uchrashuvlar” va “Hisobotlar” bo‘limlari.',
      },
    ],
  },
  {
    kalit: 'loyihalar',
    ikonka: FolderKanban,
    sarlavha: 'Loyihalar',
    qisqa: 'Oddiy papkadan farq qiladi: har bir bo‘lim — alohida loyiha.',
    tafsilot: [
      {
        sarlavha: 'Farqi nimada',
        matn: 'Oddiy papkada bo‘lim shunchaki guruh. Loyihalar papkasida esa har bir bo‘lim — mustaqil loyiha: o‘z bajarilish foizi, progress chizig‘i va “yana nechta qoldi” hisobi bilan.',
      },
      {
        sarlavha: 'Qachon ishlatiladi',
        matn: 'Boshi va oxiri bor, bir necha qadamdan iborat ishlar uchun: “Saytni ishga tushirish”, “Imtihonga tayyorgarlik”. Kundalik mayda ishlar uchun oddiy papka qulayroq.',
      },
    ],
  },
  {
    kalit: 'kechki',
    ikonka: Moon,
    sarlavha: 'Kechki reja',
    qisqa: 'Ertangi kunni bugun kechqurun belgilab qo‘yish.',
    tafsilot: [
      {
        sarlavha: 'Nima uchun kerak',
        matn: 'Ertalab “nimadan boshlasam?” deb vaqt yo‘qotmaslik uchun. Kechqurun 5 daqiqa ajratsangiz, ertangi kun tayyor rejadan boshlanadi.',
      },
      {
        sarlavha: 'Qanday ishlatiladi',
        matn: 'Ishni yozasiz, kerak bo‘lsa vaqt, papka va muhimligini tanlaysiz — u avtomatik ertangi songa qo‘yiladi.',
      },
    ],
  },
  {
    kalit: 'hisobot',
    ikonka: BarChart3,
    sarlavha: 'Hisobot',
    qisqa: 'Istalgan davr uchun natijangiz.',
    tafsilot: [
      {
        sarlavha: 'Nima ko‘rsatadi',
        matn: 'Tanlangan davrda nechta ish bajarilgani va qolgani, papkalar bo‘yicha taqsimot, qaysi yo‘nalish orqada qolayotgani.',
      },
      {
        sarlavha: 'Qanday foydali',
        matn: 'Haftada bir marta qarab chiqing: qaysi papkada ishlar to‘planib qolyapti? Demak u yerga ko‘proq vaqt kerak yoki rejani kamaytirish kerak.',
      },
    ],
  },
  {
    kalit: 'sozlamalar',
    ikonka: Settings,
    sarlavha: 'Sozlamalar',
    qisqa: 'Profil, til, ko‘rinish, yon panel tartibi va bildirishnomalar.',
    tafsilot: [
      {
        sarlavha: 'Profil',
        matn: 'Rasm yuklash va ismni o‘zgartirish. Email Google hisobiga bog‘langan — uni bu yerdan o‘zgartirib bo‘lmaydi.',
      },
      {
        sarlavha: 'Umumiy',
        matn: 'Til (o‘zbek, ingliz, rus) va vaqt mintaqasi. Eslatmalar aynan shu mintaqa bo‘yicha yuboriladi — safarga chiqsangiz o‘zgartiring.',
      },
      {
        sarlavha: 'Ko‘rinish',
        matn: 'Yorug‘, qorong‘i yoki qurilma sozlamasiga moslashadigan rejim.',
      },
      {
        sarlavha: 'Yon panel',
        matn: 'Bo‘limlar tartibini o‘zgartirasiz. Eng yuqoridagi bo‘lim — ilova ochilganda birinchi ko‘rinadigan sahifa.',
      },
      {
        sarlavha: 'Bildirishnoma',
        matn: 'Vaqtli vazifalar haqida eslatma. Brauzer bir marta ruxsat so‘raydi; ruxsatsiz eslatma kelmaydi.',
      },
    ],
  },
]

const QOSHIMCHA = [
  {
    ikonka: BellRing,
    sarlavha: 'Eslatmalar ishlashi uchun',
    matn: 'Vazifaga VAQT qo‘yilgan bo‘lishi va bildirishnomaga ruxsat berilgan bo‘lishi kerak. Ikkalasi bo‘lsa, ilova yopiq bo‘lsa ham eslatma keladi.',
  },
  {
    ikonka: Download,
    sarlavha: 'Telefonga o‘rnatish',
    matn: 'Android’da “O‘rnatish” tugmasi chiqadi. iPhone’da Safari’da oching: Ulashish → “Bosh ekranga qo‘shish”. O‘rnatilgandan keyin ilova tezroq ochiladi.',
  },
  {
    ikonka: CloudOff,
    sarlavha: 'Internetsiz ishlash',
    matn: 'Aloqa yo‘qolsa ham vazifa qo‘shish va o‘zgartirish ishlayveradi. Yozganlaringiz qurilmada saqlanadi va internet tiklanishi bilan o‘zi yuboriladi.',
  },
  {
    ikonka: Repeat2,
    sarlavha: 'Takrorlanuvchi ish bajarilgach',
    matn: 'U yo‘qolmaydi — o‘zi keyingi sanaga ko‘chadi. Vaqti va ichki ishlari ham saqlanadi.',
  },
  {
    ikonka: Gauge,
    sarlavha: 'Foizdan qachon foydalanish kerak',
    matn: 'Bir o‘tirishda tugamaydigan ishlar uchun. Mayda ishni foizga bo‘lish ortiqcha — uni shunchaki bajarilgan deb belgilang.',
  },
]

export function YoriqnomaKorinishi() {
  // Birinchi bo'lim ochiq turadi — odam nimani bosish kerakligini
  // darhol tushunsin
  const [ochiq, setOchiq] = useState<string | null>('jarayonda')

  return (
    <Sahifa
      sarlavha="Yo‘riqnoma"
      tavsif="Har bir bo‘lim nima qilishi va qanday ishlatilishi"
    >
      <p className="mb-6 rounded-2xl bg-brand-soft px-5 py-4 text-sm leading-relaxed text-text-strong">
        Samara’da ish shu tartibda yuradi:{' '}
        <strong>vazifa yozasiz → sana va muhimligini belgilaysiz → uni
        boshlaysiz → bajarilgan deb belgilaysiz.</strong>{' '}
        Qolgan hammasi shu oddiy zanjirni qulayroq qilish uchun. Quyidagi
        bo‘limlardan istaganini bosib, batafsil o‘qishingiz mumkin.
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
                <div className="border-t border-border-subtle px-4 py-3 pl-18">
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
    </Sahifa>
  )
}
