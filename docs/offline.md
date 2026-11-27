# Samara internetsiz qanday ishlaydi

> Bu hujjat ikki qismdan iborat: birinchisi oddiy foydalanuvchi uchun,
> ikkinchisi — qo'lda tekshirish ro'yxati.
>
> **MUHIM (2026-noyabr, Capacitor qo'shilgandan keyin):** veb va ilova
> (Android/iOS) endi internetsiz turlicha ishlaydi. Veb'da faqat
> ko'rish, ilovada to'liq tahrirlash. Pastda ikkisi alohida tushuntirilgan.

---

## 1. Oddiy tilda: nima ishlaydi, nima yo'q

### Ikkisida ham internetsiz ishlaydi

- **Ilova ochiladi.** Bir marta ochilgan bo'lsa, keyin internetsiz ham
  ochilaveradi (sahifa qobig'i veb'da service worker orqali, appda esa
  o'rnatilgan fayllar sifatida saqlanadi).
- **Vazifalarni ko'rish.** Oxirgi marta internet bor paytda yuklangan
  ro'yxatlar joyida turadi.
- **Kirgan holat saqlanadi.** Hisobdan birinchi marta kirish uchun
  internet shart, keyin sessiya qurilmada saqlanadi — uzoq vaqt
  (1 soatdan ko'p) internetsiz turilsa ham chiqarib yuborilmaydi.

### Ilovada (Android/iOS) — qo'shimcha, TO'LIQ tahrirlash

- **Yangi vazifa qo'shish, tahrirlash, o'chirish, bajarildi deb
  belgilash** — hammasi internetsiz ham ishlaydi. O'zgarish darhol
  ro'yxatda ko'rinadi.
- **Takrorlanuvchi vazifa.** Bajarilsa, keyingi sanaga o'zi suriladi —
  server bilan bog'lanish shart emas.
- **Ilovani yopib, qayta ochish.** Yuborilmagan o'zgarishlar qurilmada
  saqlanadi va yo'qolmaydi.
- Internet qaytganda hamma o'zgarish o'zi, tartib bilan serverga
  yuboriladi. Yuqoridagi chiziqda "N ta o'zgarish kutmoqda", so'ng
  "Sinxronlandi ✓" ko'rinadi.

### Veb'da — FAQAT ko'rish

- Vazifalarni ko'rish, sahifalar orasida yurish — ishlaydi.
- **Hech qanday o'zgartirish yuborilmaydi.** Vazifa qo'shish, "+"
  tugmasi, tahrirlash, belgilash, o'chirish, sudrab tashlash — birortasi
  ham internetsiz ishlamaydi. Urinilganda do'stona oyna chiqadi:
  "Internet aloqasi yo'q" + "Tushunarli" / "Qayta tekshirish" tugmalari.
- Sahifa tepasida yumshoq kulrang chiziq: "Offline rejim: faqat
  ko'rish". Internet qaytganda o'zi yo'qoladi.
- **Nega veb'da boshqacha:** brauzer tab'i istalgan vaqt yopilib
  ketishi mumkin — shu paytgacha "navbatda" turgan o'zgarish yo'qolib
  ketish xavfi bor. Ilova esa alohida, doimiy jarayon sifatida ishlaydi.

### Ikkisida ham internetsiz ishlamaydi — va nega

- **Birinchi marta kirish.** Google orqali kirish Google serveriga
  murojaat qiladi.
- **Boshqa qurilmadagi o'zgarishlar.** Internet yo'q paytda ilova
  faqat shu qurilmadagi ma'lumotni biladi.
- **Hali bir marta ham ochilmagan sahifa** (masalan ochilmagan loyiha).
- **Bildirishnomalar** — serverdan keladi.
- **Hisobni o'chirish, rasm yuklash, boshqa odamga topshiriq yuborish**
  — bular to'g'ridan-to'g'ri serverga boradi, na veb'da, na ilovada
  internetsiz ishlamaydi.

### iPhone va iPad — Safari (veb) cheklovlari

Veb endi faqat ko'rish rejimida ishlaydi, shuning uchun eski
"fon sinxronizatsiyasi yo'q" muammosi endi veb'ga umuman tegishli emas
— tahrirlash bo'lmagani uchun yo'qoladigan o'zgarish ham yo'q. iOS
ilovasi chiqqanda (Mac/bulut build bilan) u ham Android kabi to'liq
offline ishlaydi.

### Ikki qurilmada bir vazifa o'zgartirilsa (ilova ↔ ilova, yoki ilova ↔ veb onlayn paytda)

Oxirgi o'zgarish ustun keladi (`updated_at` bo'yicha). O'chirish ham
shu qoidaga bo'ysunadi: vazifa darhol butunlay o'chirilmaydi,
"o'chirilgan" deb belgilanadi (`deleted_at`).

---

## 2. Qo'lda tekshirish ro'yxati

### A. Veb (brauzer) — faqat ko'rish ekanini tekshirish

Chrome DevTools → **Network** → **Offline**.

| # | Qadam | Kutilgan natija |
|---|---|---|
| 1 | Ilovaga kiring, `/jarayonda`, `/bugun`, `/kelgusi` sahifalarini bir martadan oching | Kesh to'ladi |
| 2 | Network → Offline | Tepada yumshoq kulrang chiziq: "Offline rejim: faqat ko'rish" |
| 3 | Vazifalar ro'yxati ko'rinishda qolishi | Hech narsa yo'qolmaydi, bo'sh ekran chiqmaydi |
| 4 | "+" tugmasi bilan yangi vazifa qo'shishga urining | So'rov ketmaydi, "Internet aloqasi yo'q" oynasi chiqadi |
| 5 | Mavjud vazifaning checkbox'ini bosing | Hech narsa o'zgarmaydi, xuddi shu oyna chiqadi |
| 6 | Oynada "Qayta tekshirish" ni bosing (hali offline) | "Hali ham internet topilmadi" degan kichik matn chiqadi, oyna yopilmaydi |
| 7 | Oynani "Tushunarli" bilan yoping, Network → Online qiling | Yumshoq chiziq o'zi yo'qoladi |
| 8 | Endi vazifa qo'shing | Odatdagidek ishlaydi |
| 9 | DevTools → Console | Hech qanday texnik xato matni foydalanuvchiga chiqmagan bo'lishi kerak (faqat kerak bo'lsa console'da) |

### B. Ilova (Android/iOS) — to'liq offline tekshirish

Emulyator/qurilmada Wi-Fi va mobil internetni o'chiring (yoki
Android'da "Airplane mode").

| # | Qadam | Kutilgan natija |
|---|---|---|
| 1 | Ilovaga kiring, bir necha sahifani ochib chiqing | Kesh to'ladi |
| 2 | Internetni o'chiring | Tepada: "Offline rejim, o'zgarishlar saqlanmoqda" |
| 3 | Yangi vazifa qo'shing | Vazifa darhol ro'yxatda; "1 ta o'zgarish kutmoqda" |
| 4 | O'sha vazifani tahrirlang, keyin o'chiring | Ikkisi ham darhol ko'rinadi, xato chiqmaydi |
| 5 | Boshqa vazifani bajarildi deb belgilang | Doira to'ladi |
| 6 | Takrorlanuvchi vazifani bajaring | Sana keyingi kunga suriladi |
| 7 | Ilovani butunlay yopib, qayta oching (hamon offline) | Barcha o'zgarish joyida, kutayotganlar soni saqlangan |
| 8 | Internetni yoqing | Chiziq "sinxronlanmoqda", so'ng "Sinxronlandi ✓" (2-3 soniya), keyin yo'qoladi |
| 9 | Supabase → Table editor → `tasks` | Qo'shilgan vazifa bor; o'chirilgani `deleted_at` bilan; tahrirlangani yangi nom bilan |

### C. Sessiya — uzoq muddat offline (eng muhim test)

| # | Qadam | Kutilgan natija |
|---|---|---|
| 1 | Ilovaga kiring | Normal ishlaydi |
| 2 | Internetni o'chiring, ilovani yopib qo'ying | — |
| 3 | **Kamida 1 soat** kutib, internetni YOQMASDAN ilovani qayta oching | Login ekraniga TUSHMAYDI — oxirgi ko'rilgan ro'yxat chiqadi |
| 4 | Shu holatda vazifa qo'shing | Ishlaydi, navbatga tushadi |
| 5 | Internetni yoqing | Avval sessiya/token yangilanadi, so'ng navbatdagi o'zgarish yuboriladi — ikkisi ham yo'qolmaydi |

### Konfliktni tekshirish (ixtiyoriy, ikkinchi qurilma kerak)

1. Ilovada (A) offline bo'lib, vazifa nomini "A" ga o'zgartiring.
2. Veb'da (B, onlayn) o'sha vazifani "B" ga o'zgartiring.
3. A ni onlayn qiling.
4. **Kutilgan:** nom "B" bo'lib qoladi (B kechroq yozilgan).

### Nimaga e'tibor berish kerak

- Hech qanday "Xatolik yuz berdi" yoki texnik (`TypeError`, `fetch`)
  matn ekranda chiqmasligi kerak — na veb'da, na ilovada.
- DevTools → Application → IndexedDB → `keyval-store` ichida
  `samara-query-cache` bo'lishi kerak (veb va ilova ikkisida ham,
  ilovada esa `@capacitor/preferences` orqali sessiya alohida saqlanadi).

> **Avtomatlashtirilgan test (Playwright)** hozircha qo'shilmadi: u
> yangi katta bog'liqlik va alohida CI sozlamasini talab qiladi.
> Yuqoridagi ro'yxat shu stsenariyning to'liq qo'lda varianti.
