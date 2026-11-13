import type { Metadata } from 'next'
import { ALOQA_EMAIL, YANGILANDI } from '@/lib/huquqiy'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari',
  description: 'Samara ilovasidan foydalanish shartlari.',
}

export default function ShartlarSahifasi() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-text-strong">
        Foydalanish shartlari
      </h1>
      <p className="mt-1 text-sm text-text-faint">
        Oxirgi yangilanish: {YANGILANDI}
      </p>

      <Bolim sarlavha="Ilova haqida">
        <p>
          Samara — kunlik vazifalarni rejalashtirish va bajarish uchun
          mo‘ljallangan ilova. U <strong>hamma uchun bepul</strong>. Hech
          qanday to‘lov, obuna yoki ilova ichidagi xarid yo‘q.
        </p>
      </Bolim>

      <Bolim sarlavha="Hisobingiz">
        <p>
          Ilovadan foydalanish uchun Google hisobingiz orqali kirasiz.
          Hisobingiz xavfsizligi — sizning zimmangizda. Begona odam
          qurilmangizdan foydalanmasligiga ishonch hosil qiling.
        </p>
        <p className="mt-3">
          Hisobni istalgan vaqtda o‘chirishingiz mumkin. O‘chirilgan
          ma’lumotlarni qaytarib bo‘lmaydi.
        </p>
      </Bolim>

      <Bolim sarlavha="Nima qilmaslik kerak">
        <ul className="list-disc space-y-1 pl-5">
          <li>Ilovani qonunga zid maqsadlarda ishlatish</li>
          <li>Tizimga zarar yetkazishga yoki uni buzishga urinish</li>
          <li>Boshqa foydalanuvchilarning ma’lumotlariga kirishga urinish</li>
          <li>
            Avtomatlashtirilgan vositalar bilan tizimga ortiqcha yuk berish
          </li>
        </ul>
      </Bolim>

      <Bolim sarlavha="Ma’lumotlaringiz">
        <p>
          Siz kiritgan vazifalar va yozuvlar — sizniki. Biz ularga faqat
          ilovani ishlatish uchun kerak bo‘lgan darajada murojaat qilamiz.
          Batafsil:{' '}
          <a
            href="/maxfiylik"
            className="font-medium text-brand-onsoft underline"
          >
            Maxfiylik siyosati
          </a>
          .
        </p>
      </Bolim>

      <Bolim sarlavha="Kafolatlar haqida">
        <p>
          Ilova «qanday bo‘lsa, shundayligicha» taqdim etiladi. Biz uni
          uzluksiz ishlashi uchun harakat qilamiz, lekin texnik nosozliklar,
          internet uzilishi yoki xizmat ko‘rsatuvchilar tomonidagi muammolar
          bo‘lishi mumkin.
        </p>
        <p className="mt-3">
          Muhim ma’lumotlaringizning zaxira nusxasini saqlashni tavsiya
          qilamiz. Ma’lumot yo‘qolishi natijasida yuzaga kelgan zarar uchun
          javobgarlikni o‘z zimmamizga ololmaymiz.
        </p>
      </Bolim>

      <Bolim sarlavha="Xizmatni to‘xtatish">
        <p>
          Yuqoridagi shartlar qo‘pol buzilgan taqdirda hisobni cheklashga yoki
          o‘chirishga haqlimiz. Bunday holatda sizga oldindan xabar berishga
          harakat qilamiz.
        </p>
      </Bolim>

      <Bolim sarlavha="O‘zgarishlar">
        <p>
          Shartlar o‘zgarishi mumkin. Jiddiy o‘zgarishlar haqida ilova ichida
          xabar beramiz. Yangilanishdan keyin ilovadan foydalanishda davom
          etsangiz, yangi shartlarga rozilik bildirgan hisoblanasiz.
        </p>
      </Bolim>

      <Bolim sarlavha="Bog‘lanish">
        <p>
          Savollaringiz bo‘lsa:{' '}
          <a
            href={`mailto:${ALOQA_EMAIL}`}
            className="font-medium text-brand-onsoft underline"
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
