import type { Metadata } from 'next'
import { ALOQA_EMAIL, ILOVA_NOMI } from '@/lib/huquqiy'

export const metadata: Metadata = {
  title: 'Hisobni o‘chirish',
  description:
    'Samara ilovasidagi hisobingizni va barcha ma’lumotlaringizni qanday o‘chirish mumkin.',
}

/**
 * Google Play 2024-yildan beri hisob yaratish imkoni bor har bir
 * ilovadan hisobni o'chirish yo'riqnomasini TALAB QILADI: ilova
 * ichida ham, kirishsiz ochiladigan veb-sahifada ham. Sahifa
 * do'kon ro'yxatiga "Account deletion URL" sifatida kiritiladi.
 */
export default function HisobniOchirishSahifasi() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-text-strong">
        Hisobni o‘chirish
      </h1>
      <p className="mt-3 text-base leading-relaxed text-text-muted">
        {ILOVA_NOMI} hisobingizni va unga bog‘liq barcha ma’lumotlarni
        istalgan vaqtda o‘chirishingiz mumkin. Buning uchun ruxsat so‘rash
        yoki biz bilan bog‘lanish shart emas.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-strong">
          Ilova orqali (eng tez yo‘l)
        </h2>
        <ol className="mt-3 space-y-3 text-base leading-relaxed text-text-muted">
          <Qadam raqam={1}>
            Ilovani oching va <strong>Ko‘rish</strong> bo‘limiga o‘ting
          </Qadam>
          <Qadam raqam={2}>
            Pastga tushib, <strong>Hisob</strong> bo‘limini toping
          </Qadam>
          <Qadam raqam={3}>
            <strong>Hisobni o‘chirish</strong> tugmasini bosing
          </Qadam>
          <Qadam raqam={4}>
            Tasdiqlash oynasida <strong>O‘CHIRISH</strong> so‘zini yozib,
            tasdiqlang
          </Qadam>
        </ol>
        <p className="mt-4 text-base leading-relaxed text-text-muted">
          Hisob va ma’lumotlar <strong>darhol</strong> o‘chiriladi.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-strong">
          Ilovaga kira olmasangiz
        </h2>
        <p className="mt-2 text-base leading-relaxed text-text-muted">
          Hisobingizga kira olmayotgan bo‘lsangiz, o‘sha hisobga bog‘langan
          elektron pochtadan bizga xat yozing:
        </p>
        <p className="mt-3">
          <a
            href={`mailto:${ALOQA_EMAIL}?subject=${encodeURIComponent('Hisobni o‘chirish so‘rovi')}`}
            className="text-base font-semibold text-brand-primary underline"
          >
            {ALOQA_EMAIL}
          </a>
        </p>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          So‘rovni <strong>30 kun ichida</strong> bajaramiz. Xatni hisobingiz
          bog‘langan pochtadan yuborishingiz shart — bu boshqa birov sizning
          hisobingizni o‘chirib yuborishining oldini oladi.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-strong">
          Nima o‘chadi
        </h2>
        <p className="mt-2 text-base leading-relaxed text-text-muted">
          Hammasi — butunlay va qaytarib bo‘lmaydigan tarzda:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-base leading-relaxed text-text-muted">
          <li>Hisobingiz va profilingiz (ism, rasm, sozlamalar)</li>
          <li>Barcha vazifalar, papkalar va loyihalar</li>
          <li>Bajarilish tarixi va hisobotlar</li>
          <li>Bildirishnoma obunalari</li>
        </ul>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-base leading-relaxed text-red-800">
            <strong>Diqqat:</strong> o‘chirilgan ma’lumotlarni tiklab
            bo‘lmaydi. Zaxira nusxa saqlanmaydi. Muhim yozuvlaringiz bo‘lsa,
            o‘chirishdan oldin ko‘chirib oling.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-strong">
          Ma’lumot qancha vaqt saqlanadi
        </h2>
        <p className="mt-2 text-base leading-relaxed text-text-muted">
          Hech qancha. Ilova orqali o‘chirilganda ma’lumotlar bazadan darhol
          o‘chiriladi — «kutish muddati» yoki arxiv yo‘q.
        </p>
      </section>
    </article>
  )
}

function Qadam({
  raqam,
  children,
}: {
  raqam: number
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-primary">
        {raqam}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  )
}
