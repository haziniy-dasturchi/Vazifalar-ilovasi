# Google Play — to'liq yo'riqnoma

Bu yerda ikki xil ro'yxat bor:

- **A qism** — faqat siz qila oladigan ishlar (pul to'lash, shaxsni
  tasdiqlash, kalit yaratish). Men bularni bajara olmayman.
- **B qism** — allaqachon tayyor. Nusxalab qo'yish kifoya.

---

# A QISM — faqat siz qila olasiz

## A1. Play Console hisobi ochish

1. [play.google.com/console](https://play.google.com/console) ga
   `haziniyilmmaskani2025@gmail.com` bilan kiring
2. **$25** to'lang (bir martalik, umrbod)
3. Shaxsni tasdiqlang — pasport yoki ID kerak, **1–3 kun** ketadi

> Tashkilot nomidan ochsangiz, D-U-N-S raqami ham so'raladi va bu
> jarayonni bir necha haftaga cho'zadi. Yakka tartibda (shaxs sifatida)
> ochish ancha tez.

## A2. Android paketini yaratish — PWABuilder

Sizda Android SDK ham, Java ham o'rnatilmagan. Ularni o'rnatish shart
emas — **PWABuilder** brauzerda paket yasab beradi.

1. [pwabuilder.com](https://www.pwabuilder.com) ga kiring
2. `https://samarali-kun.uz` manzilini kiriting, **Start** bosing
3. **Package for stores → Android** ni tanlang
4. Sozlamalarni tekshiring:

   | Maydon | Qiymat |
   |---|---|
   | Package ID | `uz.samaralikun.samara` |
   | App name | `Samara` |
   | Short name | `Samara` |
   | Start URL | `/jarayonda` |
   | Signing key | **Create new** |

5. **Download** bosing

Arxivda ikkita muhim narsa bo'ladi:

- `app-release-bundle.aab` — Play Console'ga yuklanadi
- `signing.keystore` + parollar (`assetlinks.json` fayli ichida ham
  barmoq izi bo'ladi)

> ### ⚠️ Eng muhim ogohlantirish
>
> `signing.keystore` faylini va parolini **yo'qotmang**. Yo'qotsangiz,
> ilovani boshqa hech qachon yangilay olmaysiz — yangi ilova sifatida
> noldan chiqarishga to'g'ri keladi va barcha o'rnatgan foydalanuvchilar
> yo'qoladi.
>
> Nusxasini kamida ikki joyda saqlang (masalan Google Drive + tashqi
> disk). Parolni ham o'sha yerda yozib qo'ying.

## A3. Barmoq izini Vercel'ga qo'shish

Paket yaratilgach, SHA-256 barmoq izi kerak bo'ladi. Uni ikki joydan
olish mumkin:

- PWABuilder arxividagi `assetlinks.json` fayli ichidan, **yoki**
- Play Console → Setup → App integrity → *App signing key certificate*

Keyin Vercel'da: **Project → Settings → Environment Variables**

| Nomi | Qiymati |
|---|---|
| `ANDROID_SHA256` | `AB:CD:EF:...` (olingan barmoq izi) |
| `ANDROID_PAKET` | `uz.samaralikun.samara` |

Qo'shgandan keyin **Redeploy** qiling va tekshiring:

```
https://samarali-kun.uz/.well-known/assetlinks.json
```

Bo'sh `[]` emas, barmoq izi bilan to'lgan bo'lishi kerak.

> Buni qilmasangiz, ilova ochilganda yuqorida brauzer manzil satri
> ko'rinib turadi — foydalanuvchi "bu ilova emas, sayt ekan" deb
> o'ylaydi.

## A4. Play Console'ni to'ldirish

B qismdagi tayyor matnlarni nusxalab joylashtiring, `dokon/` papkasidagi
rasmlarni yuklang.

## A5. Yuborish

Tartib bilan boring, to'g'ridan-to'g'ri Production'ga emas:

1. **Internal testing** — darhol ishlaydi, o'zingiz sinab ko'rasiz
2. **Closed testing** — 10–20 kishi, bir hafta
3. **Production** — birinchi tekshiruv **3–7 kun**

Birinchi marta to'g'ridan-to'g'ri Production'ga yubormang: rad etilsa,
sabab noaniq qoladi va qayta yuborish yana bir haftaga cho'ziladi.

---

# B QISM — tayyor

## B1. Grafik materiallar — `dokon/` papkasida

| Fayl | O'lcham | Qayerga |
|---|---|---|
| `ilova-ikonkasi-512.png` | 512×512 | App icon |
| `feature-graphic.png` | 1024×500 | Feature graphic |
| `skrinshot-1.png` | 1080×1920 | Phone screenshots |
| `skrinshot-2.png` | 1080×1920 | Phone screenshots |
| `skrinshot-3.png` | 1080×1920 | Phone screenshots |
| `skrinshot-4.png` | 1080×1920 | Phone screenshots |

Skrinshotlardagi vazifalar **namunaviy** — shaxsiy ma'lumotlaringiz
ko'rinmaydi.

## B2. Ilova nomi (30 belgigacha — hozir 25)

```
Samara — vazifalar rejasi
```

## B3. Qisqa tavsif (80 belgigacha — hozir 67)

```
Kunlik ishlaringizni rejalashtiring va bajaring. Oddiy, tez, bepul.
```

## B4. To'liq tavsif (4000 belgigacha — hozir 1333)

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

## B5. Kategoriya va aloqa

- **Kategoriya:** Productivity
- **Teg:** Task Management
- **Email:** `haziniyilmmaskani2025@gmail.com`
- **Veb-sayt:** `https://samarali-kun.uz`
- **Maxfiylik siyosati:** `https://samarali-kun.uz/maxfiylik`
- **Hisobni o'chirish:** `https://samarali-kun.uz/hisobni-ochirish`

## B6. Data safety anketasi

**Ma'lumot yig'asizmi?** → Ha

| Ma'lumot | Yig'iladi | Maqsad | Majburiy | Ulashiladi |
|---|---|---|---|---|
| Ism | Ha | App functionality | Ha | Yo'q |
| Email | Ha | App functionality, Account management | Ha | Yo'q |
| Profil rasmi | Ha | App functionality | Yo'q | Yo'q |
| Foydalanuvchi matni (vazifalar) | Ha | App functionality | Ha | Yo'q |
| Qurilma ID (bildirishnoma) | Ha | App functionality | Yo'q | Yo'q |

Qolgan savollar:

- Uzatishda shifrlanadimi? → **Ha**
- Foydalanuvchi o'chirishni so'ray oladimi? → **Ha**
- O'chirish havolasi → `https://samarali-kun.uz/hisobni-ochirish`
- Reklama/marketing uchunmi? → **Yo'q**
- Uchinchi shaxslarga sotiladimi? → **Yo'q**

## B7. Content rating

- Kategoriya: **Utility, Productivity, Communication or Other**
- Zo'ravonlik / jinsiy mazmun / qo'rqinchli mazmun / qimor /
  giyohvand moddalar → hammasiga **Yo'q**
- Foydalanuvchilar o'zaro muloqot qiladimi? → **Yo'q**
- Joylashuv ulashiladimi? → **Yo'q**
- Shaxsiy ma'lumot yig'iladimi? → **Ha**

Natija: **Everyone / 3+**

## B8. Kodda tayyor

- `/maxfiylik`, `/shartlar`, `/hisobni-ochirish` — kirishsiz ochiladi
- `/.well-known/assetlinks.json` — barmoq izini kutyapti
- `metadataBase` va huquqiy sahifalar `samarali-kun.uz` ga qaratilgan

---

# Yakuniy tekshiruv ro'yxati

- [ ] Play Console hisobi ochildi va tasdiqlandi (A1)
- [ ] Domenda Google bilan kirish sinab ko'rildi
- [ ] `/maxfiylik`, `/shartlar`, `/hisobni-ochirish` ochilyapti
- [ ] Hisobni o'chirish ilova ichida sinaldi
- [ ] `.aab` yaratildi, keystore **ikki joyda** saqlandi (A2)
- [ ] `ANDROID_SHA256` Vercel'da, redeploy qilindi (A3)
- [ ] `assetlinks.json` barmoq izini qaytaryapti (A3)
- [ ] Rasmlar yuklandi, matnlar joylashtirildi (B)
- [ ] Data safety va content rating to'ldirildi (B6, B7)
- [ ] Internal testing orqali telefonda sinaldi (A5)
