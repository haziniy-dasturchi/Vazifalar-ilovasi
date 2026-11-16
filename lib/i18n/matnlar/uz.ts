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
  'bosh.meta.sarlavha': 'Samara — bepul vazifalar boshqaruvchisi va kunlik reja',
  'bosh.meta.qisqaSarlavha': 'Samara — bepul vazifalar boshqaruvchisi',
  // Tavsif 155 belgidan oshmasligi kerak — Google qolganini kesadi
  'bosh.meta.tavsif':
    'Bepul to-do ro‘yxat va kunlik reja ilovasi — o‘zbek tilida. Vazifalar, vaqtli eslatmalar, papkalar va kunlik hisobot. Reklamasiz, internetsiz ishlaydi.',

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

  // ---------- Umumiy harakatlar ----------
  'umumiy.saqlash': 'Saqlash',
  'umumiy.saqlanmoqda': 'Saqlanmoqda…',
  'umumiy.qoshish': 'Qo‘shish',
  'umumiy.ochirish': 'O‘chirish',
  'umumiy.yopish': 'Yopish',
  'umumiy.bekor': 'Bekor qilish',
  'umumiy.tayyor': 'Tayyor',
  'umumiy.kuting': 'Kuting…',
  'umumiy.yoqish': 'Yoqish',
  'umumiy.qaytaUrinish': 'Qayta urinish',
  'umumiy.yuklanmoqda': 'Yuklanmoqda…',
  'umumiy.xato': 'Xatolik yuz berdi',
  'umumiy.xatoMatn': 'Ma’lumotni yuklab bo‘lmadi. Internetni tekshirib ko‘ring.',
  'umumiy.bajarilmadi': 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.',
  'umumiy.saqlanmadi': 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.',

  // ---------- Navigatsiya ----------
  'nav.jarayonda': 'Jarayonda',
  'nav.bugun': 'Bugun',
  'nav.kelgusi': 'Kelgusi',
  'nav.korish': 'Ko‘rish',
  'nav.papkalar': 'Papkalar',
  'nav.yangiPapka': 'Yangi papka',
  'nav.arxiv': 'Arxivlangan papkalar',
  'nav.sozlamalar': 'Sozlamalar',
  'nav.chiqish': 'Chiqish',
  'nav.profilMenyusi': 'Profil menyusi',
  'nav.asosiyBolimlar': 'Asosiy bo‘limlar',

  // ---------- Vazifa ----------
  'vazifa.yangi': 'Yangi vazifa',
  'vazifa.tahrirlash': 'Vazifani tahrirlash',
  'vazifa.nomiJoy': 'Nima qilish kerak?',
  'vazifa.qachon': 'Qachon',
  'vazifa.muhimlik': 'Muhimlik',
  'vazifa.bajarildi': 'Bajarildi',
  'vazifa.papka': 'Papka',
  'vazifa.bolim': 'Bo‘lim',
  'vazifa.bolimsiz': 'Bo‘limsiz',
  'vazifa.loyiha': 'Loyiha',
  'vazifa.loyihasiz': 'Loyihasiz',
  'vazifa.qoshildi': 'Vazifa qo‘shildi',
  'vazifa.yangilandi': 'Vazifa yangilandi',
  'vazifa.ochirildi': 'Vazifa o‘chirildi',
  'vazifa.ochirishSarlavha': 'Vazifani o‘chirish',
  'vazifa.ochirishTasdiq':
    '"{nom}" butunlay o‘chadi. Buni qaytarib bo‘lmaydi.',
  'vazifa.ochirilmadi': 'O‘chirib bo‘lmadi. Qayta urinib ko‘ring.',

  // ---------- Sana tanlagich ----------
  'sana.tanlash': 'Sana tanlash',
  'sana.bugun': 'Bugun',
  'sana.ertaga': 'Ertaga',
  'sana.keyingiHafta': 'Keyingi hafta',
  'sana.damOlish': 'Dam olish',
  'sana.sanasiz': 'Sanasiz',
  'sana.vaqtQoshish': 'Vaqt qo‘shish',
  'sana.vaqtniOlib': 'Vaqtni olib tashlash',
  'sana.boshqaVaqt': 'Boshqa vaqt kiriting',
  'sana.takrorlanish': 'Takrorlanish',
  'sana.takrorniOlib': 'Takrorlanishni olib tashlash',
  'sana.harKuni': 'Har kuni',
  'sana.ishKunlari': 'Ish kunlari',
  'sana.harHafta': 'Har hafta',
  'sana.harOy': 'Har oy',
  'sana.oldingiOy': 'Oldingi oy',
  'sana.keyingiOy': 'Keyingi oy',

  // ---------- Sozlamalar ----------
  'sozlamalar.sarlavha': 'Sozlamalar',
  'sozlamalar.tavsif':
    'Profil, ko‘rinish va bildirishnomalarni shu yerdan boshqaring.',
  'sozlamalar.bolimlar': 'Sozlamalar bo‘limlari',
  'sozlamalar.yuklanmadi':
    'Sozlamalarni yuklab bo‘lmadi. Internetni tekshirib, sahifani yangilang.',
  'sozlamalar.tab.profil': 'Profil',
  'sozlamalar.tab.umumiy': 'Umumiy',
  'sozlamalar.tab.korinish': 'Ko‘rinish',
  'sozlamalar.tab.yonPanel': 'Yon panel',
  'sozlamalar.tab.bildirishnoma': 'Bildirishnoma',

  'sozlamalar.rasm.sarlavha': 'Profil rasmi',
  'sozlamalar.rasm.tavsif': 'JPG, PNG yoki WebP. Eng katta hajm — 2 MB.',
  'sozlamalar.rasm.yuklash': 'Rasm yuklash',
  'sozlamalar.rasm.yuklanmoqda': 'Yuklanmoqda…',
  'sozlamalar.rasm.olibTashlash': 'Olib tashlash',
  'sozlamalar.rasm.yangilandi': 'Profil rasmi yangilandi',
  'sozlamalar.rasm.olindi': 'Profil rasmi olib tashlandi',
  'sozlamalar.rasm.notogriTur': 'Faqat JPG, PNG yoki WebP rasm yuklash mumkin',
  'sozlamalar.rasm.kattaHajm': 'Rasm 2 MB dan katta bo‘lmasin',
  'sozlamalar.rasm.yuklanmadi':
    'Rasmni yuklab bo‘lmadi. Internetni tekshirib, qayta urining.',

  'sozlamalar.ism.sarlavha': 'Ism',
  'sozlamalar.ism.saqlandi': 'Ism saqlandi',
  'sozlamalar.ism.bosh': 'Ism bo‘sh bo‘lmasin',
  'sozlamalar.email.sarlavha': 'Email',
  'sozlamalar.email.tavsif':
    '{email} — Google hisobiga bog‘langan, shu yerdan o‘zgartirib bo‘lmaydi.',

  'sozlamalar.mintaqa.sarlavha': 'Vaqt mintaqasi',
  'sozlamalar.mintaqa.tavsif':
    'Eslatmalar shu mintaqa bo‘yicha yuboriladi. Hozir u yerda soat {vaqt}.',
  'sozlamalar.mintaqa.qurilmadagi': 'Qurilmadagisini olish ({mintaqa})',
  'sozlamalar.mintaqa.saqlandi': 'Vaqt mintaqasi saqlandi',

  'sozlamalar.til.sarlavha': 'Til',
  'sozlamalar.til.tavsif':
    'Ilova interfeysi tili. Tanlov shu qurilmada darhol qo‘llanadi va hisobingizga ham saqlanadi.',
  'sozlamalar.til.saqlandi': 'Til o‘zgartirildi',

  'sozlamalar.korinish.sarlavha': 'Ko‘rinish',
  'sozlamalar.korinish.tizim': 'Tizim',
  'sozlamalar.korinish.yorug': 'Yorug‘',
  'sozlamalar.korinish.qorongi': 'Qorong‘i',
  'sozlamalar.korinish.tizimTavsif':
    'Qurilma sozlamasiga moslashadi — hozir {holat}.',
  'sozlamalar.korinish.qorongiTavsif':
    'Doim qorong‘i — qurilma yorug‘ rejimda bo‘lsa ham.',
  'sozlamalar.korinish.yorugTavsif':
    'Doim yorug‘ — qurilma qorong‘i rejimda bo‘lsa ham.',

  'sozlamalar.yonPanel.sarlavha': 'Bo‘limlar tartibi',
  'sozlamalar.yonPanel.tavsif':
    'Eng yuqoridagi bo‘lim ilova ochilganda birinchi ko‘rinadi. Hozir — «{bolim}».',
  'sozlamalar.yonPanel.birinchi': 'birinchi',
  'sozlamalar.yonPanel.yuqoriga': '{nom} — yuqoriga',
  'sozlamalar.yonPanel.pastga': '{nom} — pastga',
  'sozlamalar.yonPanel.sukut': 'Sukut tartibini qaytarish',
  'sozlamalar.yonPanel.izoh':
    'Tartib hisobingizga saqlanadi — telefonda ham, kompyuterda ham bir xil bo‘ladi.',

  'sozlamalar.bildirishnoma.sarlavha': 'Vazifa eslatmalari',
  'sozlamalar.bildirishnoma.qollamaydi':
    'Bu brauzer bildirishnomani qo‘llab-quvvatlamaydi.',
  'sozlamalar.bildirishnoma.radEtilgan':
    'Brauzer sozlamalarida ruxsat berilmagan.',
  // ---------- Bildirishnoma eslatmasi (pastki lenta) ----------
  'eslatma.sarlavha': 'Eslatmani yoqasizmi?',
  'eslatma.matn':
    'Vaqti belgilangan vazifalar haqida eslatib turamiz — ilova yopiq bo‘lsa ham.',
  'umumiy.keyinroq': 'Keyinroq',

  'sozlamalar.bildirishnoma.yoqilgan':
    'Vaqti belgilangan vazifalar haqida eslatib turamiz — ilova yopiq bo‘lsa ham.',
  'sozlamalar.bildirishnoma.ochiq':
    'Vaqti belgilangan vazifalar haqida eslatma olish uchun yoqing.',
  'sozlamalar.bildirishnoma.tavsiya': 'Tavsiya etiladi',
  'sozlamalar.bildirishnoma.tavsiyaMatn':
    'Eslatmalarsiz vaqti belgilangan vazifalar e’tibordan chetda qolishi mumkin. Yoqish uchun brauzer bir marta ruxsat so‘raydi.',
  'sozlamalar.bildirishnoma.qaytarish':
    'Ruxsatni qaytarish uchun brauzer manzil qatoridagi qulf belgisini bosing va «Bildirishnomalar» ni ruxsat etilgan holatga o‘tkazing.',
  'sozlamalar.bildirishnoma.yoqildi': 'Bildirishnoma yoqildi',
  'sozlamalar.bildirishnoma.ochirildi': 'Bildirishnoma o‘chirildi',
  'sozlamalar.bildirishnoma.ruxsatYoq':
    'Brauzer ruxsat bermadi. Sozlamalardan yoqing.',
} as const

export type MatnKaliti = keyof typeof uz
