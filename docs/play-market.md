# Google Play — to'liq yo'riqnoma va tayyor matnlar

Bu fayl Play Console'ga kiritiladigan hamma narsani bir joyga to'playdi.
Har bir bo'limdan matnni nusxalab, to'g'ridan-to'g'ri joylashtirish mumkin.

---

## 1. Avval qilinadigan ishlar (siz)

| № | Ish | Narx | Izoh |
|---|---|---|---|
| 1 | Google Play Developer hisobi ochish | **$25**, bir martalik | [play.google.com/console](https://play.google.com/console) — shaxsni tasdiqlash 1–3 kun |
| 2 | `samarali-kun.uz` domenini Vercel'ga ulash | domen narxi | Vercel → Project → Settings → Domains |
| 3 | Ilovani `samarali-kun.uz` da ishlashiga o'tkazish | — | Pastdagi 3-bo'limga qarang |
| 4 | Android paketini yaratish | bepul | PWABuilder orqali — 5-bo'lim |

> **Eslatma:** paket nomi (`uz.samaralikun.samara`) bir marta tanlanadi va
> **hech qachon o'zgartirib bo'lmaydi**. Domen ham shunga bog'liq, shuning
> uchun domenni paketdan OLDIN hal qilish kerak.

---

## 2. Do'kon ro'yxati uchun matnlar

### Ilova nomi (30 belgigacha)

```
Samara — vazifalar rejasi
```

### Qisqa tavsif (80 belgigacha)

```
Kunlik ishlaringizni rejalashtiring va bajaring. Oddiy, tez, bepul.
```

### To'liq tavsif (4000 belgigacha)

```
Samara — kunlik ishlaringizni tartibga soluvchi sodda va tez ilova.
Ortiqcha sozlamalarsiz, chalkash menyularsiz: ochasiz, yozasiz, bajarasiz.

HAR KUN — SAMARALI KUN

Ertalab nima qilish kerakligini bilib turish — kunni yengil boshlashning
eng qisqa yo'li. Samara shu uchun yaratilgan.


ASOSIY IMKONIYATLAR

• Jarayonda — hozir qilayotgan ishingiz doim ko'z o'ngingizda
• Bugun va Kelgusi — qaysi ish qachonligini bir qarashda ko'rasiz
• Papkalar va loyihalar — ishlaringizni o'zingizga qulay tartibda saqlang
• Bajarilish foizi — bir kunda tugamaydigan ishning qancha qismi
  bitganini belgilab boring, suv to'lgandek to'lib boradi
• Takrorlanuvchi vazifalar — har kuni, ish kunlari, haftalik yoki oylik
• Eslatmalar — vaqti kelganda telefoningizga bildirishnoma keladi
• Kechki reja — ertangi kunni bugun kechqurun belgilab qo'ying
• Hisobot — qaysi davrda qancha ish bajarganingizni ko'ring


INTERNETSIZ HAM ISHLAYDI

Metroda, yo'lda, aloqa yo'q joyda — ilova to'xtamaydi. Yozganlaringiz
qurilmangizda saqlanadi va internet paydo bo'lishi bilan o'zi
sinxronlanadi. Hech narsa yo'qolmaydi.


BUTUNLAY BEPUL

To'lov yo'q, obuna yo'q, ilova ichida xarid yo'q. Reklama ham yo'q.
Ma'lumotlaringiz sotilmaydi — ilovada kuzatuv tizimlari umuman yo'q.


O'ZBEK TILIDA

Ilova to'liq o'zbek tilida — tarjima emas, shu til uchun yozilgan.
```

### Kategoriya

- **Kategoriya:** Productivity (Samaradorlik)
- **Teg:** Task Management / To-Do List

### Aloqa

- **Email:** `haziniyilmmaskani2025@gmail.com` ← *tasdiqlang yoki o'zgartiring*
- **Veb-sayt:** `https://samarali-kun.uz`
- **Maxfiylik siyosati:** `https://samarali-kun.uz/maxfiylik`
- **Hisobni o'chirish:** `https://samarali-kun.uz/hisobni-ochirish`

---

## 3. Domenni o'zgartirish (paketdan oldin!)

Domen ulangach, kodda ikkita joyni yangilash kerak:

1. `app/layout.tsx` → `metadataBase`
2. `lib/huquqiy.ts` → `DOMEN`

Shuningdek **Google Cloud Console**'da OAuth sozlamalariga yangi domenni
qo'shish shart, aks holda kirish ishlamay qoladi:

- *Authorized JavaScript origins:* `https://samarali-kun.uz`
- *Authorized redirect URIs:* Supabase'dagi callback manzili

Va **Supabase** → Authentication → URL Configuration:
- *Site URL:* `https://samarali-kun.uz`
- *Redirect URLs:* ro'yxatga yangi domenni qo'shing

---

## 4. Grafik materiallar

| Nima | O'lcham | Holat |
|---|---|---|
| Ilova ikonkasi | 512×512 PNG | ✅ bor — `public/icons/pwa-512.png` |
| Feature graphic | 1024×500 PNG | ❌ yaratish kerak |
| Telefon skrinshotlari | kamida 2 ta, 9:16 (masalan 1080×1920) | ❌ yaratish kerak |
| Planshet skrinshotlari | ixtiyoriy | — |

**Skrinshotlar uchun tavsiya:** haqiqiy shaxsiy vazifalaringiz ko'rinib
qolmasligi uchun namunaviy ma'lumot bilan tayyorlagan ma'qul. Eng yaxshi
4 ta ekran: *Jarayonda*, *Bugun* (bajarilish foizi bilan), *Loyihalar*,
*Hisobot*.

---

## 5. Android paketini yaratish (PWABuilder)

Sizda Android SDK ham, Java ham o'rnatilmagan — ularni o'rnatish shart
emas. **PWABuilder** brauzerning o'zida paket yasab beradi:

1. [pwabuilder.com](https://www.pwabuilder.com) ga kiring
2. `https://samarali-kun.uz` manzilini kiriting
3. **Package for stores → Android** ni tanlang
4. Sozlamalarda:
   - *Package ID:* `uz.samaralikun.samara`
   - *App name:* `Samara`
   - *Signing key:* **"Create new"** ni tanlang
5. Yuklab olingan arxivda ikkita muhim narsa bo'ladi:
   - `.aab` fayli — Play Console'ga yuklanadi
   - `signing.keystore` va paroli — **buni yo'qotmang!**

> ⚠️ **Eng muhim ogohlantirish:** keystore faylini va parolini yo'qotsangiz,
> ilovani **boshqa hech qachon yangilay olmaysiz**. Yangi ilova sifatida
> qaytadan chiqarishga to'g'ri keladi, barcha foydalanuvchilar yo'qoladi.
> Nusxasini kamida ikki joyda saqlang.

---

## 6. assetlinks.json ni to'ldirish

Paket yaratilgandan keyin SHA-256 barmoq izini olib, Vercel'ga muhit
o'zgaruvchisi sifatida qo'shing:

| O'zgaruvchi | Qiymat |
|---|---|
| `ANDROID_SHA256` | Play Console → Setup → App integrity → *App signing key certificate* dagi SHA-256 |
| `ANDROID_PAKET` | `uz.samaralikun.samara` (standart qiymat, o'zgartirmasangiz ham bo'ladi) |

Qo'shgandan keyin ilovani qayta deploy qiling va tekshiring:

```
https://samarali-kun.uz/.well-known/assetlinks.json
```

Natija bo'sh `[]` emas, barmoq izi bilan to'lgan bo'lishi kerak.

> Agar buni qilmasangiz, ilova ochilganda yuqorida brauzer manzil satri
> ko'rinib turadi — foydalanuvchi uchun bu "ilova emas, sayt" degan
> taassurot qoldiradi.

---

## 7. Data safety anketasi (javoblar tayyor)

Play Console → Policy → App content → Data safety:

**Ma'lumot yig'asizmi?** Ha

| Ma'lumot turi | Yig'iladimi | Maqsad | Majburiymi | Ulashiladimi |
|---|---|---|---|---|
| Ism | Ha | Ilova funksiyasi | Ha | Yo'q |
| Email manzil | Ha | Ilova funksiyasi, Hisobni boshqarish | Ha | Yo'q |
| Foto (profil rasmi) | Ha | Ilova funksiyasi | Yo'q | Yo'q |
| Foydalanuvchi yaratgan matn (vazifalar) | Ha | Ilova funksiyasi | Ha | Yo'q |
| Qurilma ID (bildirishnoma uchun) | Ha | Ilova funksiyasi | Yo'q | Yo'q |

**Qolgan savollar:**

- Ma'lumot uzatishda shifrlanadimi? → **Ha** (HTTPS)
- Foydalanuvchi o'chirishni so'rashi mumkinmi? → **Ha**
- O'chirish havolasi → `https://samarali-kun.uz/hisobni-ochirish`
- Reklama yoki marketing uchun ishlatiladimi? → **Yo'q**
- Uchinchi shaxslarga sotiladimi? → **Yo'q**

---

## 8. Content rating

So'rovnomada:

- Kategoriya: **Utility, Productivity, Communication or Other**
- Zo'ravonlik, jinsiy mazmun, qo'rqinchli mazmun, qimor, giyohvand
  moddalar → hammasiga **Yo'q**
- Foydalanuvchilar o'zaro muloqot qila oladimi? → **Yo'q**
- Joylashuv ulashiladimi? → **Yo'q**
- Shaxsiy ma'lumot yig'iladimi? → **Ha** (email, ism)

Natija: **Everyone / 3+** bo'lishi kerak.

---

## 9. Chiqarishdan oldingi tekshiruv ro'yxati

- [ ] Domen ulandi va ishlayapti
- [ ] Google OAuth yangi domenda sinab ko'rildi
- [ ] `/maxfiylik`, `/shartlar`, `/hisobni-ochirish` kirishsiz ochiladi
- [ ] Hisobni o'chirish ilova ichida sinab ko'rildi
- [ ] `.aab` fayli yaratildi, keystore ikki joyda saqlandi
- [ ] `ANDROID_SHA256` Vercel'da o'rnatildi
- [ ] `assetlinks.json` barmoq izini qaytaryapti
- [ ] Internal testing orqali o'z telefoningizda sinaldi
- [ ] Skrinshotlar va feature graphic tayyor
- [ ] Data safety va content rating to'ldirildi

---

## 10. Chiqarish tartibi (tavsiya)

1. **Internal testing** — faqat siz va bir necha odam. Darhol ishlaydi.
2. **Closed testing** — 10–20 kishi, bir hafta.
3. **Production** — birinchi tekshiruv odatda **3–7 kun** davom etadi.

Birinchi marta to'g'ridan-to'g'ri Production'ga yubormang: rad etilsa,
sabab noaniq bo'lib qoladi va qayta yuborish yana bir haftaga cho'ziladi.
