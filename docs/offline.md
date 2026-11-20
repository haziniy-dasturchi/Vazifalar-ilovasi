# Samara internetsiz qanday ishlaydi

> Bu hujjat ikki qismdan iborat: birinchisi oddiy foydalanuvchi uchun,
> ikkinchisi — qo'lda tekshirish ro'yxati.

---

## 1. Oddiy tilda: nima ishlaydi, nima yo'q

### Internetsiz ishlaydi

- **Ilova ochiladi.** Telefon yoki kompyuterda bir marta ochilgan
  bo'lsa, keyin internetsiz ham ochilaveradi.
- **Vazifalarni ko'rish.** Oxirgi marta internet bor paytda yuklangan
  ro'yxatlar joyida turadi.
- **Yangi vazifa qo'shish.** Qo'shilgan vazifa darhol ro'yxatda
  ko'rinadi.
- **Tahrirlash va o'chirish** — endigina qo'shilgan vazifani ham.
- **Bajarildi deb belgilash**, foizini o'zgartirish.
- **Takrorlanuvchi vazifa.** Bajarilsa, keyingi sanaga o'zi suriladi —
  server bilan bog'lanish shart emas.
- **Ilovani yopib, qayta ochish.** Yuborilmagan o'zgarishlar qurilmada
  saqlanadi va yo'qolmaydi.

Internet qaytganda hamma o'zgarish o'zi, tartib bilan serverga
yuboriladi. Yuqoridagi chiziqda "N ta o'zgarish kutmoqda" yozuvi
ko'rinib turadi.

### Internetsiz ishlamaydi — va nega

- **Birinchi marta kirish.** Google orqali kirish Google serveriga
  murojaat qiladi. Hisobga birinchi marta kirish uchun internet shart.
  Bir marta kirgandan keyin sessiya qurilmada saqlanadi va internetsiz
  ham ochilaveradi.
- **Boshqa qurilmadagi o'zgarishlar.** Telefoningizda qilingan
  o'zgarish kompyuterda faqat sinxronlashdan keyin ko'rinadi. Internet
  yo'q paytda ilova faqat shu qurilmadagi ma'lumotni biladi.
- **Hali bir marta ham ochilmagan sahifa.** Masalan loyiha sahifasi
  (`/papka/...`) internet bor paytda bir marta ochilmagan bo'lsa,
  internetsiz ochilmasligi mumkin — u qurilmada saqlanmagan.
- **Bildirishnomalar.** Eslatma serverdan keladi, shuning uchun
  internetsiz kelmaydi.
- **Hisobni o'chirish, rasm yuklash, topshiriq yuborish** — bular
  to'g'ridan-to'g'ri serverga boradi.

### iPhone va iPad (Safari) cheklovlari

- **Fon sinxronizatsiyasi yo'q.** Androidda brauzer ilova yopiq
  bo'lsa ham o'zgarishlarni yuborib qo'yishi mumkin. iPhone'da
  bunday imkoniyat yo'q: o'zgarishlar **ilovani qayta ochganingizda**
  yuboriladi.
- **Saqlash joyi tozalanib ketishi mumkin.** Safari ilova uzoq vaqt
  (taxminan 7 hafta) ishlatilmasa saqlangan ma'lumotni o'chirib
  yuborishi mumkin. Ilova bosh ekranga o'rnatilgan bo'lsa, bu xavf
  ancha kamayadi — shuning uchun o'rnatib qo'yish tavsiya etiladi.
- Ilova "doimiy saqlash" ruxsatini so'raydi; berilsa, ma'lumot
  o'chirilmaydi.

### Ikki qurilmada bir vazifa o'zgartirilsa

Oxirgi o'zgarish ustun keladi (`updated_at` bo'yicha). Ya'ni
telefonda soat 10:00 da, kompyuterda 11:00 da o'zgartirilgan bo'lsa,
11:00 dagisi qoladi. Internetsiz qilingan eski o'zgarish yangisining
ustiga yozilmaydi.

O'chirish ham shu qoidaga bo'ysunadi: vazifa darhol butunlay
o'chirilmaydi, "o'chirilgan" deb belgilanadi (`deleted_at`). Shuning
uchun boshqa qurilmadagi o'zgarish izsiz yo'qolmaydi.

---

## 2. Qo'lda tekshirish ro'yxati

Chrome DevTools → **Network** → **Offline** (yoki Application →
Service Workers → Offline).

### Tayyorgarlik

1. Ilovaga kiring, bir necha vazifa va kamida bitta loyiha bo'lsin.
2. `/jarayonda`, `/bugun`, `/kelgusi`, `/hisobot` sahifalarini bir
   martadan oching (kesh to'lsin).
3. DevTools → Application → Service Workers: `sw.js` **activated**
   bo'lishi kerak.
4. Application → Storage: "Persistent" yozuvini tekshiring.

### Offline stsenariy

| # | Qadam | Kutilgan natija |
|---|---|---|
| 1 | Network → Offline | Yuqorida qora chiziq: "Internet yo'q…" |
| 2 | Yangi vazifa qo'shing | Vazifa darhol ro'yxatda; chiziqda "1 ta o'zgarish kutmoqda" |
| 3 | O'sha vazifani oching va nomini o'zgartiring | O'zgarish darhol ko'rinadi, xato chiqmaydi |
| 4 | O'sha vazifani o'chiring | Ro'yxatdan yo'qoladi |
| 5 | Yana bitta vazifa qo'shib, bajarildi deb belgilang | Doira to'ladi, vazifa "bajarildi" bo'ladi |
| 6 | Takrorlanuvchi vazifani (masalan "har kuni") bajaring | Sana keyingi kunga suriladi, vazifa yana ochiq bo'ladi |
| 7 | Sahifani yangilang (F5) | Ilova ochiladi, barcha offline o'zgarishlar joyida, kutayotganlar soni saqlanadi |
| 8 | Ilovani butunlay yopib, qayta oching | Xuddi shu natija |
| 9 | Network → Online | Chiziq "sinxronlanmoqda" ga o'zgaradi, so'ng yo'qoladi |
| 10 | Supabase → Table editor → `tasks` | Qo'shilgan vazifa bor; o'chirilganida `deleted_at` to'lgan; tahrir qilingani yangi nom bilan |

### Konfliktni tekshirish

1. Ikki brauzerda (yoki telefon + kompyuter) bitta hisobga kiring.
2. A qurilmani offline qiling va vazifa nomini "A" ga o'zgartiring.
3. B qurilmada (online) o'sha vazifani "B" ga o'zgartiring.
4. A ni online qiling.
5. **Kutilgan:** nom "B" bo'lib qoladi (B kechroq yozilgan), A ning
   eski o'zgarishi ustiga yozilmaydi. A qurilmada ham bir necha
   soniyadan keyin "B" ko'rinadi.

### Nimaga e'tibor berish kerak

- Hech qanday "Xatolik yuz berdi" oynasi chiqmasligi kerak.
- DevTools → Application → IndexedDB → `keyval-store` ichida
  `samara-query-cache` bo'lishi kerak.
- Offline paytda tarmoq so'rovlari (Network) qizil bo'lishi normal —
  muhimi, interfeys ishlashda davom etadi.

> **Avtomatlashtirilgan test (Playwright)** hozircha qo'shilmadi:
> u yangi katta bog'liqlik va alohida CI sozlamasini talab qiladi.
> Yuqoridagi ro'yxat shu stsenariyning to'liq qo'lda varianti.
