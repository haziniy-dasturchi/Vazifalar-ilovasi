/**
 * O'zbekcha matnlar — ASOS TIL.
 *
 * Bu fayl boshqa tillar uchun shablon: `MatnKaliti` tipi aynan shu
 * obyektdan olinadi, shuning uchun bu yerga kalit qo'shilsa, qolgan
 * tillarda ham qo'shilmaguncha loyiha yig'ilmaydi. Tarjima esdan
 * chiqib qolishi mumkin emas.
 *
 * Kalit nomlanishi: `<joy>.<narsa>` — masalan `bosh.sarlavha`.
 */
export const uz = {
  // ---------- Bosh sahifa (ochiq, qidiruv uchun) ----------
  'bosh.meta.sarlavha': 'Samara — o‘zbek tilidagi vazifalar va kunlik reja ilovasi',
  'bosh.meta.qisqaSarlavha': 'Samara — vazifalar va kunlik reja ilovasi',
  'bosh.meta.tavsif':
    'Samara — o‘zbek tilidagi bepul vazifalar va kunlik reja ilovasi. To-do ro‘yxati, eslatmalar, papkalar va kunlik hisobot. Reklamasiz, internetsiz ham ishlaydi.',

  'bosh.h1': 'Vazifalar va kunlik reja ilovasi — o‘zbek tilida',
  'bosh.kirish':
    'Samara kunlik ishlaringizni bir joyda rejalashtirish va bajarish uchun. To-do ro‘yxati, vaqtli eslatmalar, papkalar va kunlik hisobot. Reklamasiz, kuzatuvsiz, hamma uchun bepul.',
  'bosh.tugma.boshlash': 'Bepul boshlash',
  'bosh.tugma.ochish': 'Samara’ni ochish',
  'bosh.kirishIzoh':
    'Google hisobingiz bilan kiring — alohida parol o‘ylab topish shart emas.',

  'bosh.imkoniyatlar.sarlavha': 'Nimalar bor',
  'bosh.imkoniyat.bittaIsh.nom': 'Bir vaqtda bitta ish',
  'bosh.imkoniyat.bittaIsh.matn':
    'Boshlangan vazifa alohida ko‘rinadi. “Nima qilishim kerak?” degan savol bir bosishda hal bo‘ladi.',
  'bosh.imkoniyat.reja.nom': 'Kunlik va kelgusi reja',
  'bosh.imkoniyat.reja.matn':
    'Bugungi, kechikkan va oldindagi ishlar alohida ro‘yxatlarda. Takrorlanadigan vazifalar ham bor.',
  'bosh.imkoniyat.eslatma.nom': 'Vaqtli eslatmalar',
  'bosh.imkoniyat.eslatma.matn':
    'Vaqti belgilangan vazifa haqida telefoningizga bildirishnoma keladi — ilova yopiq bo‘lsa ham.',
  'bosh.imkoniyat.papka.nom': 'Papka va loyihalar',
  'bosh.imkoniyat.papka.matn':
    'Ish, o‘qish, uy yumushlari — har birini alohida papkaga ajrating, ichida bo‘limlar oching.',
  'bosh.imkoniyat.foiz.nom': 'Bajarilish foizi',
  'bosh.imkoniyat.foiz.matn':
    'Bir kunda tugamaydigan ishni foiz bilan belgilang: bugun 50%, qolganini ertaga davom ettiring.',
  'bosh.imkoniyat.offline.nom': 'Internetsiz ishlaydi',
  'bosh.imkoniyat.offline.matn':
    'Aloqa yo‘qolsa ham yozganingiz saqlanadi va internet tiklanishi bilan o‘zi yuboriladi.',
  'bosh.imkoniyat.mavzu.nom': 'Tungi rejim',
  'bosh.imkoniyat.mavzu.matn':
    'Yorug‘, qorong‘i yoki qurilma sozlamasiga moslashadigan ko‘rinish.',
  'bosh.imkoniyat.bepul.nom': 'Reklamasiz va bepul',
  'bosh.imkoniyat.bepul.matn':
    'Reklama yo‘q, kuzatuv tizimlari yo‘q. Ma’lumotlaringiz sotilmaydi.',

  'bosh.savollar.sarlavha': 'Ko‘p so‘raladigan savollar',
  'bosh.savol.bepul': 'Samara bepulmi?',
  'bosh.javob.bepul':
    'Ha, butunlay bepul. Pulli tarif, reklama va yashirin to‘lovlar yo‘q.',
  'bosh.savol.ornatish': 'Ilovani telefonga o‘rnatsa bo‘ladimi?',
  'bosh.javob.ornatish':
    'Ha. Samara — PWA ilova: brauzerda ochib, bosh ekranga qo‘shasiz va u oddiy ilova kabi ishlaydi. Android’da “O‘rnatish” tugmasi chiqadi, iPhone’da Safari’dagi Ulashish → “Bosh ekranga qo‘shish”.',
  'bosh.savol.offline': 'Internetsiz ishlaydimi?',
  'bosh.javob.offline':
    'Ha. Internetsiz qo‘shilgan va o‘zgartirilgan vazifalar qurilmada saqlanadi, aloqa tiklanganda esa o‘zi serverga yuboriladi.',
  'bosh.savol.eslatma': 'Eslatmalar qanday ishlaydi?',
  'bosh.javob.eslatma':
    'Vazifaga vaqt belgilansa, o‘sha paytda telefoningizga bildirishnoma keladi. Buning uchun bildirishnomaga bir marta ruxsat berish kifoya.',
  'bosh.savol.xavfsizlik': 'Ma’lumotlarim xavfsizmi?',
  'bosh.javob.xavfsizlik':
    'Har bir foydalanuvchi faqat o‘z ma’lumotini ko‘radi — bu baza darajasida majburlanadi. Hisobni istalgan vaqtda ilova ichidan butunlay o‘chirib tashlashingiz mumkin.',

  'bosh.chaqiriq.sarlavha': 'Bugundan boshlang',
  'bosh.chaqiriq.matn':
    'Ro‘yxatdan o‘tish bir bosishda. Hech qanday to‘lov ma’lumoti so‘ralmaydi.',

  'bosh.havola.maxfiylik': 'Maxfiylik siyosati',
  'bosh.havola.shartlar': 'Foydalanish shartlari',
  'bosh.havola.hisobOchirish': 'Hisobni o‘chirish',
  'bosh.tilTanlash': 'Til',
} as const

export type MatnKaliti = keyof typeof uz
