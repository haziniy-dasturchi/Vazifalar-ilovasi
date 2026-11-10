import type { Metadata } from 'next'
import { ALOQA_EMAIL, YANGILANDI } from '@/lib/huquqiy'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati',
  description:
    'Samara ilovasi qanday ma’lumotlarni yig‘adi, nima uchun ishlatadi va ularni qanday himoya qiladi.',
}

export default function MaxfiylikSahifasi() {
  return (
    <article className="prose-samara">
      <h1 className="text-2xl font-bold text-text-strong">
        Maxfiylik siyosati
      </h1>
      <p className="mt-1 text-sm text-text-faint">
        Oxirgi yangilanish: {YANGILANDI}
      </p>

      <Bolim sarlavha="Qisqacha">
        <p>
          Samara — kunlik vazifalarni rejalashtirish uchun bepul ilova. Biz
          ilovaning ishlashi uchun zarur bo‘lgan ma’lumotlarnigina
          saqlaymiz. Sizning ma’lumotlaringizni <strong>sotmaymiz</strong>,
          reklama uchun ishlatmaymiz va uchinchi shaxslarga bermaymiz.
          Ilovada reklama ham, kuzatuv (tracking) tizimlari ham yo‘q.
        </p>
      </Bolim>

      <Bolim sarlavha="Qanday ma’lumot yig‘amiz">
        <p className="font-medium text-text-strong">
          1. Hisobingiz haqida
        </p>
        <p>
          Ilovaga Google hisobingiz orqali kirasiz. Google bizga quyidagilarni
          beradi: elektron pochta manzilingiz, ismingiz va profil rasmingiz.
          Biz Google parolingizni ko‘rmaymiz va saqlamaymiz.
        </p>

        <p className="mt-4 font-medium text-text-strong">
          2. Siz yaratgan ma’lumotlar
        </p>
        <p>
          Vazifalaringiz, ularning tavsiflari, papkalar va loyihalar, sanalar
          va vaqtlar, bajarilish foizi, takrorlanish sozlamalari. Bular
          ilovaning asosiy mazmuni — ularsiz ilova ishlay olmaydi.
        </p>

        <p className="mt-4 font-medium text-text-strong">3. Sozlamalar</p>
        <p>
          Vaqt mintaqangiz (eslatmalarni to‘g‘ri vaqtda yuborish uchun),
          mavzu (yorug‘/qorong‘i), dam olish kunlari va shunga o‘xshash
          shaxsiy sozlamalar.
        </p>

        <p className="mt-4 font-medium text-text-strong">
          4. Bildirishnoma obunasi
        </p>
        <p>
          Agar bildirishnomani <em>o‘zingiz yoqsangiz</em>, brauzeringiz
          bergan texnik manzil (endpoint) va shifrlash kalitlari saqlanadi.
          Bu faqat qurilmangizga eslatma yuborish uchun kerak.
          Bildirishnomani o‘chirsangiz, bu yozuv darhol o‘chiriladi.
        </p>
      </Bolim>

      <Bolim sarlavha="Nima uchun ishlatamiz">
        <p>
          Faqat uchta maqsadda: ilovani sizga ko‘rsatish, vazifalaringizni
          qurilmalaringiz orasida sinxronlash va siz so‘ragan eslatmalarni
          yuborish. Boshqa hech narsa uchun emas.
        </p>
      </Bolim>

      <Bolim sarlavha="Qayerda saqlanadi">
        <p>
          Ma’lumotlar Supabase (PostgreSQL) xizmatining Yevropa Ittifoqidagi
          serverlarida saqlanadi. Har bir foydalanuvchi faqat o‘z
          ma’lumotlarini ko‘ra oladi — bu bazaning o‘zida, satr darajasidagi
          xavfsizlik qoidalari (Row Level Security) bilan ta’minlangan,
          ya’ni ilova kodidagi xatolik ham boshqa birovning ma’lumotini
          ochib qo‘ya olmaydi.
        </p>
        <p className="mt-3">
          Ilova internetsiz ishlashi uchun ma’lumotlarning nusxasi
          qurilmangizda ham saqlanadi. Hisobdan chiqsangiz yoki brauzer
          ma’lumotlarini tozalasangiz, bu nusxa o‘chadi.
        </p>
      </Bolim>

      <Bolim sarlavha="Kim ko‘ra oladi">
        <p>
          Ma’lumotlaringizni siz ko‘rasiz. Biz ularni hech kimga sotmaymiz va
          bermaymiz. Istisno faqat qonun talab qilgan holatlar bo‘lishi
          mumkin.
        </p>
        <p className="mt-3">
          Ilova ishlashi uchun quyidagi xizmatlardan foydalanamiz:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — ma’lumotlar bazasi va kirish tizimi
          </li>
          <li>
            <strong>Vercel</strong> — ilovani internetda joylashtirish
          </li>
          <li>
            <strong>Google</strong> — hisobingiz orqali kirish
          </li>
        </ul>
      </Bolim>

      <Bolim sarlavha="Qancha vaqt saqlanadi">
        <p>
          Hisobingiz mavjud ekan. Hisobni o‘chirsangiz, barcha ma’lumotlaringiz
          ham o‘chadi va qaytarib bo‘lmaydi.
        </p>
      </Bolim>

      <Bolim sarlavha="Sizning huquqlaringiz">
        <ul className="list-disc space-y-1 pl-5">
          <li>Istalgan vaqtda hisobingizni va barcha ma’lumotlaringizni o‘chirish</li>
          <li>Ma’lumotlaringizni ko‘rish va tahrirlash</li>
          <li>Bildirishnomalarni yoqish yoki o‘chirish</li>
        </ul>
        <p className="mt-3">
          Hisobni o‘chirish uchun ilovadagi <strong>Ko‘rish → Hisob →
          Hisobni o‘chirish</strong> bo‘limiga o‘ting yoki{' '}
          <a
            href="/hisobni-ochirish"
            className="font-medium text-brand-primary underline"
          >
            shu sahifadagi
          </a>{' '}
          yo‘riqnomaga qarang.
        </p>
      </Bolim>

      <Bolim sarlavha="Bolalar">
        <p>
          Ilova 13 yoshdan kichik bolalarga mo‘ljallanmagan va ulardan
          ataylab ma’lumot yig‘maydi.
        </p>
      </Bolim>

      <Bolim sarlavha="O‘zgarishlar">
        <p>
          Bu siyosat o‘zgarsa, yuqoridagi sana yangilanadi. Jiddiy
          o‘zgarishlar bo‘lsa, ilova ichida xabar beramiz.
        </p>
      </Bolim>

      <Bolim sarlavha="Bog‘lanish">
        <p>
          Savollaringiz bo‘lsa:{' '}
          <a
            href={`mailto:${ALOQA_EMAIL}`}
            className="font-medium text-brand-primary underline"
          >
            {ALOQA_EMAIL}
          </a>
        </p>
      </Bolim>
    </article>
  )
}

function Bolim({
  sarlavha,
  children,
}: {
  sarlavha: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-text-strong">{sarlavha}</h2>
      <div className="mt-2 space-y-3 text-base leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  )
}
