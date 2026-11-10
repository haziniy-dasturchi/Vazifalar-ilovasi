# Play Market'ga chiqarish — qadamma-qadam

Hisob: **haziniyilmmaskani2025@gmail.com**

Bu yerda **faqat siz qila oladigan** ishlar yozilgan. Tayyor matnlar va
rasmlar [play-market.md](play-market.md) da — ularni o'sha yerdan
nusxalaysiz.

Har bir qadamdan keyin menga xabar bering, men keyingisiga tayyorlab
beraman.

---

# 1-QADAM — Play Console hisobini ochish

> ⏱ 20 daqiqa + tasdiqlashni kutish 1–3 kun
> 💵 $25 (bir martalik, umrbod)

1. Brauzerda oching: [play.google.com/console](https://play.google.com/console)
2. **haziniyilmmaskani2025@gmail.com** bilan kiring
3. **«Create account»** ni bosing
4. Turini tanlang:
   - **Personal (yakka tartibda)** ← buni tanlang, tezroq
   - *Organization* — D-U-N-S raqami so'raydi, bir necha haftaga cho'ziladi
5. Ma'lumotlarni to'ldiring (ism, manzil, telefon — pasportdagidek)
6. **$25** to'lang (karta kerak)
7. Shaxsni tasdiqlash uchun hujjat yuklang (pasport yoki ID)

Keyin **kuting**. Google tasdiqlagach, emailga xabar keladi.

**✋ Shu yerda to'xtang va menga yozing: «Play Console tayyor».**

---

# 2-QADAM — Ilova yaratish

> ⏱ 10 daqiqa

1. Play Console'da **«Create app»** ni bosing
2. To'ldiring:

   | Maydon | Qiymat |
   |---|---|
   | App name | `Samara — vazifalar rejasi` |
   | Default language | `Uzbek` (yo'q bo'lsa `English (US)`) |
   | App or game | **App** |
   | Free or paid | **Free** |

3. Ikkita katakchani belgilang (Developer Program Policies va US export laws)
4. **«Create app»**

---

# 3-QADAM — Android paketini yaratish (PWABuilder)

> ⏱ 15 daqiqa
> 💵 bepul

Sizda Android dasturchi vositalari o'rnatilmagan — ularni o'rnatish
shart emas, PWABuilder brauzerda paket yasab beradi.

1. Oching: [pwabuilder.com](https://www.pwabuilder.com)
2. Maydonga yozing: `https://samarali-kun.uz`
3. **«Start»** ni bosing, tahlil tugashini kuting
4. **«Package for stores»** → **«Android»** ni tanlang
5. **«All settings»** ni ochib, tekshiring:

   | Maydon | Qiymat |
   |---|---|
   | Package ID | `uz.samaralikun.samara` |
   | App name | `Samara` |
   | Short name | `Samara` |
   | Launcher name | `Samara` |
   | Start URL | `/jarayonda` |
   | Display mode | `standalone` |
   | Signing key | **Create new** |

6. **«Download package»** ni bosing

Yuklab olingan ZIP ichida:

- `app-release-bundle.aab` ← Play Console'ga yuklanadi
- `signing.keystore` ← **kalit fayli**
- `signing-key-info.txt` ← **parollar**
- `assetlinks.json` ← ichida barmoq izi bor

> ## ⚠️ ENG MUHIM OGOHLANTIRISH
>
> `signing.keystore` va `signing-key-info.txt` — bu ilovangizning
> **kaliti**. Yo'qotsangiz, ilovani **boshqa hech qachon yangilay
> olmaysiz**. Yangi ilova sifatida noldan chiqarishga to'g'ri keladi va
> o'rnatgan odamlarning hammasi yo'qoladi.
>
> **Hozir qiling:** ZIP'ni Google Drive'ga ham, flesh diskka ham
> nusxalang. Ikki joyda tursin.

**✋ Menga yozing: «paket tayyor» va `assetlinks.json` fayli ichidagi
matnni menga yuboring** (yoki `signing-key-info.txt` dagi SHA-256
qatorini). Men barmoq izini sozlayman.

---

# 4-QADAM — Barmoq izini ulash

Bu qadamni **men qilaman** — sizdan faqat barmoq izi kerak (3-qadam).

Men Vercel'ga `ANDROID_SHA256` o'zgaruvchisini qo'shaman va
`https://samarali-kun.uz/.well-known/assetlinks.json` to'g'ri
javob berayotganini tekshiraman.

> Agar Vercel'ga mening kirishim bo'lmasa, sizga aniq ko'rsatma
> beraman — 2 daqiqalik ish.

---

# 5-QADAM — Do'kon sahifasini to'ldirish

> ⏱ 30 daqiqa

Play Console → **Grow** → **Store presence** → **Main store listing**

[play-market.md](play-market.md) dagi B qismidan nusxalang:

| Maydon | Qayerdan |
|---|---|
| App name | B2 |
| Short description | B3 |
| Full description | B4 |
| App icon | `dokon/ilova-ikonkasi-512.png` |
| Feature graphic | `dokon/feature-graphic.png` |
| Phone screenshots | `dokon/skrinshot-1..4.png` (to'rttasini ham) |

Keyin **Store settings**:

- Category: **Productivity**
- Email: `haziniyilmmaskani2025@gmail.com`
- Website: `https://samarali-kun.uz`
- Privacy policy: `https://samarali-kun.uz/maxfiylik`

---

# 6-QADAM — App content (anketalar)

> ⏱ 30 daqiqa

Play Console → **Policy** → **App content**. Beshta bo'lim bor:

### 6.1 Privacy policy
`https://samarali-kun.uz/maxfiylik`

### 6.2 App access
**«All functionality is available without special access»** —
*Yo'q*, chunki kirish kerak. Shuning uchun:

- **«All or some functionality is restricted»** ni tanlang
- **«Add new instructions»**:
  - Name: `Google bilan kirish`
  - Instructions: `Ilovaga kirish uchun istalgan Google hisobi yetarli.
    Alohida sinov hisobi kerak emas — "Google bilan davom etish"
    tugmasini bosib kiring.`

### 6.3 Ads
**«No, my app does not contain ads»**

### 6.4 Content rating
So'rovnomani to'ldiring — javoblar [play-market.md](play-market.md)
B7 bo'limida.

### 6.5 Data safety
Javoblar [play-market.md](play-market.md) B6 bo'limida.

**Account deletion URL:** `https://samarali-kun.uz/hisobni-ochirish`

### 6.6 Target audience
- Yosh: **18 va undan katta** (eng sodda yo'l — bolalar uchun
  qo'shimcha talablar chiqmaydi)

---

# 7-QADAM — Avval o'zingiz sinab ko'ring

> ⏱ 20 daqiqa
> **To'g'ridan-to'g'ri Production'ga yubormang!**

1. Play Console → **Testing** → **Internal testing**
2. **«Create new release»**
3. `app-release-bundle.aab` faylini yuklang
4. Release name: `1.0.0`
5. Release notes: `Birinchi versiya`
6. **«Next»** → **«Save and publish»**
7. **Testers** bo'limida o'z emailingizni qo'shing
8. Sizga havola beriladi — telefonda oching va ilovani o'rnating

**Telefonda tekshiring:**

- [ ] Ilova ochilyaptimi
- [ ] Tepada brauzer manzil satri **yo'qmi** (bo'lsa — 4-qadam
      bajarilmagan)
- [ ] Google bilan kirish ishlaydimi
- [ ] Vazifa qo'shish ishlaydimi
- [ ] Internetni o'chirib ko'ring — ilova ishlayaptimi
- [ ] Ko'rish → Hisobni o'chirish tugmasi bormi

**✋ Menga yozing: «sinov tugadi» va nima ishlamaganini ayting.**

---

# 8-QADAM — Hammaga chiqarish

> ⏱ 10 daqiqa + Google tekshiruvi **3–7 kun**

1. Play Console → **Production** → **Create new release**
2. Internal testing'dagi `.aab` ni qayta ishlating
   («Add from library»)
3. Countries: **O'zbekiston** (yoki hamma davlat)
4. **«Send for review»**

Keyin kuting. Natija emailga keladi.

Rad etilsa — xabardagi sababni menga yuboring, tuzatamiz va qayta
yuboramiz.

---

# Umumiy jadval

| Qadam | Kim | Vaqt |
|---|---|---|
| 1. Console hisobi | **Siz** | 20 daq + 1–3 kun kutish |
| 2. Ilova yaratish | **Siz** | 10 daq |
| 3. Paket (PWABuilder) | **Siz** | 15 daq |
| 4. Barmoq izi | **Men** | 5 daq |
| 5. Do'kon sahifasi | **Siz** (matnlar tayyor) | 30 daq |
| 6. Anketalar | **Siz** (javoblar tayyor) | 30 daq |
| 7. Sinov | **Siz** | 20 daq |
| 8. Chiqarish | **Siz** | 10 daq + 3–7 kun |

**Jami sizning ishingiz:** taxminan 2 soat + kutish.
