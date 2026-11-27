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
  Gauge,
  Keyboard,
  Moon,
  Play,
  Repeat2,
  Send,
  Settings,
  Sun,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { useT } from '@/components/app/til-provayder'
import { useTanishuv } from '@/components/tanishuv/tanishuv-provayder'
import { panelFaol } from '@/lib/tanishuv'

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

const BOLIMLAR: Bolim[] = [
  {
    kalit: 'jarayonda',
    ikonka: Play,
    sarlavha: 'Jarayonda',
    qisqa: 'Hozir ustida ishlayotgan ishingiz. Ilova shu sahifadan ochiladi.',
    rasm: '/yoriqnoma/jarayonda.png',
    rasmIzoh:
      'Boshlangan ishlar sariq chiziq bilan ajralib turadi.',
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
    rasm: '/yoriqnoma/bugun.png',
    rasmIzoh:
      'Kechikkanlar tepada, bugungilar o‘rtada, bajarilganlar pastda.',
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
    rasm: '/yoriqnoma/vazifa.png',
    rasmIzoh:
      'Vazifa oynasi: nom, izoh, sana, muhimlik va foiz.',
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
    kalit: 'kalit-sozlar',
    ikonka: Keyboard,
    sarlavha: 'Tez yozish (kalit so‘zlar)',
    qisqa:
      'Nom yozayotganda sana, vaqt, takror va muhimlikni so‘z bilan ayting — ilova o‘zi tushunadi.',
    rasm: '/yoriqnoma/kalit-sozlar.png',
    rasmIzoh:
      'Taniqlangan so‘z rang bilan belgilanadi va saqlanganda nomdan olib tashlanadi.',
    tafsilot: [
      {
        sarlavha: 'Qanday ishlatiladi',
        matn:
          'Vazifa nomini yozayotganda shunchaki qo‘shib qo‘ying: “Hisobot ertaga 9”, “To‘lov har 15”, “Dars har se”, “Shoshilinch ish p1”. Taniqlangan qism rang bilan belgilanadi, sana va muhimlik maydonlari esa darhol to‘ladi.',
      },
      {
        sarlavha: 'Qanday so‘zlar tushuniladi',
        matn:
          'Sana: bugun, ertaga, indinga, 25-noyabr, 25.11. Takror: har kuni, har hafta, har oy, ish kunlari, har 15 (oyning 15-sanasi), har se (har seshanba), har 2 kunda. Vaqt: 12:00, 9:30, soat 12. Muhimlik: p1, p2, p3, p4.',
      },
      {
        sarlavha: 'Noto‘g‘ri tanisa',
        matn:
          'Belgilangan qismni bir marta bosing — u oddiy matnga aylanadi. Yoki kursor uning oxirida turganda Backspace bosing.',
      },
      {
        sarlavha: 'Xotirjam bo‘ling',
        matn:
          'Yolg‘iz son hech qachon sana yoki vaqt deb tanilmaydi. “Ahror akaga 7 ta kitob” yoki “4 mln pul berish” o‘zgarmay qoladi.',
      },
    ],
  },
  {
    kalit: 'izoh',
    ikonka: AlignLeft,
    sarlavha: 'Izoh',
    qisqa: 'Vazifa nomi ostidagi qo‘shimcha tafsilotlar uchun joy.',
    rasm: '/yoriqnoma/izoh.png',
    rasmIzoh: 'Izoh ro‘yxatda nom ostida bitta qatorda ko‘rinadi.',
    tafsilot: [
      {
        sarlavha: 'Nima uchun kerak',
        matn:
          'Vazifa nomi qisqa bo‘lgani ma’qul — ro‘yxatda bir ko‘rishda o‘qilsin. Manzil, telefon raqami, havola yoki qadamlar ro‘yxati kabi tafsilotlar izohga yoziladi.',
      },
      {
        sarlavha: 'Qanday yoziladi',
        matn:
          'Vazifa oynasida nom ostidagi “Izoh” maydoniga yozing. Enter vazifani saqlaydi, yangi qator kerak bo‘lsa Shift+Enter bosing.',
      },
      {
        sarlavha: 'Havolalar',
        matn:
          'Izohga yozilgan havola bosiladigan bo‘ladi — ro‘yxatdan turib ochish mumkin.',
      },
    ],
  },
  {
    kalit: 'papkalar',
    ikonka: FolderOpen,
    sarlavha: 'Papkalar va bo‘limlar',
    qisqa: 'Ishlaringizni turi bo‘yicha ajratish.',
    rasm: '/yoriqnoma/papkalar.png',
    rasmIzoh:
      'Yon paneldagi papkalar ro‘yxati.',
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
    rasm: '/yoriqnoma/loyihalar.png',
    rasmIzoh:
      'Loyihalar holat bo‘yicha uch guruhga bo‘linadi.',
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
    rasm: '/yoriqnoma/hisobot.png',
    rasmIzoh:
      'Davr tanlanadi, kartalar bosilsa ro‘yxat ochiladi.',
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
    kalit: 'topshiriqlar',
    ikonka: Send,
    sarlavha: 'Topshiriqlar',
    qisqa: 'Boshqa Samara foydalanuvchisiga ish topshirish va javobini kuzatish.',
    rasm: '/yoriqnoma/topshiriqlar.png',
    rasmIzoh:
      'Kelgan topshiriq: kim yuborgani, muddati va tugmalar.',
    tafsilot: [
      {
        sarlavha: 'Qanday yuboriladi',
        matn: '“Topshiriqlar” bo‘limida “Topshiriq yuborish” tugmasini bosing. Qabul qiluvchining email manzilini, ishni, kerak bo‘lsa izoh, muddat va muhimligini yozasiz. Avval yuborgan manzillaringiz tavsiya bo‘lib chiqadi — qayta yozish shart emas.',
      },
      {
        sarlavha: 'Qabul qiluvchi nima ko‘radi',
        matn: 'Unga bildirishnoma keladi va topshiriq “Menga kelgan” ro‘yxatida paydo bo‘ladi. Ikki tugma bor: qabul qilish yoki rad etish. Qabul qilsa, ish uning Kiruvchi papkasiga oddiy vazifa bo‘lib tushadi. Rad etsa, sababini yozib qoldiradi.',
      },
      {
        sarlavha: 'Holatini kuzatish',
        matn: '“Men yuborgan” ro‘yxatida har bir topshiriqning holati turadi: javob kutilmoqda, qabul qilingan, rad etilgan (sababi bilan) yoki bajarilgan. Qabul qiluvchi vazifani tugatsa, holat o‘zi “bajarilgan”ga o‘tadi.',
      },
      {
        sarlavha: 'Kimga yuborish mumkin',
        matn: 'Faqat Samara foydalanuvchilariga. Begona manzilga xat yuborilmaydi. Agar u odam hali ro‘yxatdan o‘tmagan bo‘lsa, ro‘yxatdan o‘tgan kuni topshiriq uning ilovasida ko‘rinadi.',
      },
      {
        sarlavha: 'Maxfiylik',
        matn: 'Qabul qiluvchi faqat o‘sha topshiriqni va sizning ismingiz bilan emailingizni ko‘radi. Boshqa vazifalaringiz, papkalaringiz va hisobotingiz unga ko‘rinmaydi. Javob berilmagan topshiriqni bekor qilishingiz mumkin.',
      },
    ],
  },
  {
    kalit: 'offline',
    ikonka: CloudOff,
    sarlavha: 'Internetsiz ishlash',
    qisqa: 'Aloqa yo‘q bo‘lsa ham ishlayverasiz — yozganingiz yo‘qolmaydi.',
    rasm: '/yoriqnoma/offline.png',
    rasmIzoh:
      'Internet yo‘qolganda yuqorida qora chiziq va kutayotgan o‘zgarishlar soni chiqadi.',
    tafsilot: [
      {
        sarlavha: 'Nima ishlaydi',
        matn:
          'Vazifa qo‘shish, tahrirlash, o‘chirish, bajarildi deb belgilash va foizni o‘zgartirish — hammasi internetsiz ishlaydi. Takrorlanuvchi vazifa ham keyingi sanaga o‘zi suriladi.',
      },
      {
        sarlavha: 'Qachon saqlanadi',
        matn:
          'O‘zgarishlar qurilmada navbatga tushadi. Internet qaytishi bilan o‘zi, tartib bilan yuboriladi. Ilovani yopib qo‘ysangiz ham yo‘qolmaydi.',
      },
      {
        sarlavha: 'Nima ishlamaydi',
        matn:
          'Birinchi marta kirish (Google talab qiladi), boshqa qurilmadagi o‘zgarishlarni ko‘rish va bildirishnomalar — bular internet bilan ishlaydi.',
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

/**
 * Yo'riqnomaning o'zi — sahifa o'ramisiz.
 *
 * Alohida ajratilgan, chunki u ikki joyda ko'rinadi: `/yoriqnoma`
 * sahifasida va Sozlamalar ichidagi bo'limda. Ikki nusxa yozilsa,
 * ular asta-sekin bir-biridan farq qila boshlardi.
 */
export function YoriqnomaMazmuni() {
  // Birinchi bo'lim ochiq turadi — odam nimani bosish kerakligini
  // darhol tushunsin
  const [ochiq, setOchiq] = useState<string | null>('jarayonda')

  return (
    <>
      <TanishuvKartasi />

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
  const davomEtsaBoladi = Boolean(holat?.papkaId && !holat.tugadi && holat.yopilgan)

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-amber-300/60 bg-amber-400/10 p-5 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl" aria-hidden>
        🎓
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-strong">{t('tanishuv.yoriqnoma.s')}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{t('tanishuv.yoriqnoma.m')}</p>
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
