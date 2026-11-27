# Samara — Android ilovasini chiqarish qo'llanmasi

> Bu qo'llanma mobil dasturlashni bilmaydigan odam uchun yozilgan.
> Har bir qadam "qayerga bosish" darajasida. Agar biror joyda
> ekraningizdagi narsa bu yerdagidan farq qilsa (Google interfeysi
> vaqti-vaqti bilan o'zgaradi), menga shu joyning skrinshotini yuboring.

**Qisqacha, hozirgi holat:** loyiha Android ilova (Capacitor) sifatida
tayyor. Siz: (1) kompyuterga bir dastur o'rnatasiz, (2) telefoningizda
sinab ko'rasiz, (3) Play Market uchun "imzolangan" fayl yasaysiz,
(4) Play Console'da ro'yxat to'ldirib, yuklaysiz. Har biri pastda.

---

## 1-QISM: Kompyuterga o'rnatish

Faqat **bitta dastur** kerak: **Android Studio**. U o'zi bilan kerakli
hamma narsani (Android SDK, Java) olib keladi.

1. Brauzerda oching: `https://developer.android.com/studio`
2. **Download Android Studio** tugmasini bosing, shartlarni qabul
   qiling, Windows versiyasini yuklab oling.
3. Yuklangan `.exe` faylni ishga tushiring, hamma joyda **Next** /
   **Finish** bosib o'tsangiz bo'ladi (standart sozlamalar yetarli).
4. Birinchi ochilishda "Import Settings" so'rasa — **Do not import** /
   **Skip**.
5. "Install Type" — **Standard** ni tanlang, **Finish** bosing.
   Bu bosqich SDK'ni yuklaydi — internetga bog'liq, 10-20 daqiqa
   ketishi mumkin.

### Loyihani ochish

1. Android Studio ochilganda **"Open"** tugmasini bosing.
2. Shu papkani tanlang:
   ```
   C:\Users\user\Desktop\Vazifalar ilovasi\android
   ```
   (⚠️ `android` papkaning O'ZINI oching, tashqarisini emas)
3. Pastda "Gradle sync" degan chiziq yugurib turadi — tugashini
   kuting (birinchi marta 5-15 daqiqa, internet kerak). Tugagach
   pastda yashil ✔ chiqadi.

---

## 2-QISM: Telefonda sinab ko'rish (APK)

Har safar kod o'zgarganda, Android Studio'ni ochishdan OLDIN terminalda
(VS Code'da yoki Windows Terminal'da, loyiha papkasida) shu buyruqni
ishga tushiring:

```bash
npm run build:app
```

Bu veb qismni yangi holatga qurib, Android loyihasiga ko'chiradi.
Shundan keyin Android Studio'da:

1. Yuqoridagi menyu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Tugagach, pastki o'ng burchakda bildirishnoma chiqadi: **"locate"**
   havolasini bosing — fayl shu yerda:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

### Telefonga o'rnatish

1. Shu `app-debug.apk` faylni telefonga yuboring (USB kabel, Telegram
   "Saved Messages", Google Drive — qaysi qulay bo'lsa).
2. Telefonda faylni oching. Birinchi marta Android "Noma'lum manbadan
   o'rnatishga ruxsat berilsinmi?" deb so'raydi — **ruxsat bering**
   (bu faqat SIZ o'rnatayotgan fayl uchun, xavfli emas).
3. **O'rnatish** tugmasini bosing.

> Telefon USB orqali ulangan va "USB debugging" yoqilgan bo'lsa,
> Android Studio'dagi yashil **▶ Run** tugmasi orqali ham to'g'ridan-
> to'g'ri o'rnatish mumkin — har safar APK qidirib yurish shart emas.

---

## 3-QISM: Play Market uchun imzolangan fayl (AAB)

### Keystore nima va nega BENIHOYAT muhim

**Keystore** — bu ilovangizning "raqamli imzosi"ga mo'ljallangan maxsus
fayl + parol. Play Market birinchi marta yuklaganingizda ilovangizni
shu imzo bilan "tanib oladi". Keyingi YANGILANISHLARNI faqat AYNAN
SHU keystore bilan imzolangan fayl orqali yuklash mumkin.

> ⚠️ **Agar keystore'ni yo'qotsangiz:** ilovangizni YANGILAB
> BO'LMAYDI. Google buni qaytarib bera olmaydi, hech kim bera olmaydi
> — bu matematik kalit, zaxira nusxasi yo'q bo'lsa, tamom. Yagona yo'l
> — butunlay YANGI ilova sifatida qayta chiqarish, bu esa barcha eski
> foydalanuvchilarni, reytingni, yuklab olishlar sonini yo'qotish
> degani.

**Shuning uchun:** yaratilgandan keyin DARHOL kamida 2 joyda zaxira
nusxa saqlang (masalan: kompyuterdagi `.secrets/` papka + Google
Drive/boshqa bulut + USB flesh). Parolni ham ALOHIDA, xotirjam joyda
yozib qo'ying.

### Keystore yaratish va AAB yasash

1. Android Studio'da: **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** ni tanlang → **Next**
3. "Key store path" ostida **Create new...** tugmasini bosing
4. Ochilgan oynada:
   - **Key store path** — **"..."** bosib, shu manzilni ko'rsating va
     fayl nomini kiriting:
     ```
     C:\Users\user\Desktop\Vazifalar ilovasi\.secrets\samara-release.jks
     ```
     (`.secrets` papkasi git'ga tushmaydi — xavfsiz joy)
   - **Password** va **Confirm** — kuchli parol o'ylab, **albatta
     boshqa joyga yozib qo'ying**
   - **Alias** — masalan `samara`
   - **Password** (key uchun, alias ostida) — xohlasangiz xuddi
     shunday qoldiring
   - **Validity (years)** — kamida **25** (Google tavsiyasi)
   - **Certificate** — Ism/Tashkilot: xohlasangiz "Haziniy ilm
     maskani" yozing, qolganini bo'sh qoldirsa ham bo'ladi
   - **OK**
5. Endi parolni kiritib **Next**
6. "Destination Folder" — standart joyni qoldiring, **release**
   tanlangan bo'lsin, ikkala imzo turi (**V1** va **V2**) belgilangan
   bo'lsin (odatda standart) → **Finish**
7. Tugagach pastda bildirishnoma chiqadi — **locate** bosing. Fayl:
   ```
   android\app\release\app-release.aab
   ```

### Parolni va faylni qayerga yozib qo'yish

`.secrets` papkasida yangi fayl yarating: `android-keystore-eslatma.txt`
— ichiga keystore fayl yo'li, parol va alias nomini yozib qo'ying.
Bu papka git'ga tushmaydi, lekin **kompyuter buzilsa ham yo'qolmasin**
deb, shu faylni (va `.jks` faylning o'zini) tashqi joyga (USB, Google
Drive'dagi SHAXSIY, boshqa bilan ulashilmagan papka) albatta nusxalab
qo'ying.

**Keyingi safar ilova yangilanganda** (5-QISM) xuddi shu keystore
kerak bo'ladi — "Create new" EMAS, "Choose existing" orqali shu faylni
tanlaysiz.

---

## 4-QISM: Play Console'da ilova yaratish

1. `https://play.google.com/console` ga kiring (Play Console hisobingiz
   bilan — `docs/play-market-qadamlar.md`dagi 1-qadam allaqachon
   boshlangan).
2. **Create app** tugmasini bosing.
3. To'ldiring:
   - **App name:** Samara
   - **Default language:** O'zbek (yoki ingliz — keyin qo'shimcha
     tillar qo'shish mumkin)
   - **App or game:** App
   - **Free or paid:** Free
   - Deklaratsiyalar (Developer Program Policies, US export laws) —
     o'qib, belgilang

### AAB yuklash

1. Chap menyu: **Release → Testing → Internal testing** (eng tez yo'l
   — ichki sinov, kutish talab qilinmaydi).
2. **Create a new release**
3. AAB faylni (`app-release.aab`) shu yerga tortib tashlang (drag &
   drop) yoki **Upload** bosib tanlang.
4. "Release notes" — qisqa yozing: masalan "Birinchi versiya".
5. **Save** → **Review release** → **Start rollout**.

### Do'kon ro'yxati (Store listing)

Chap menyu: **Grow → Store presence → Main store listing**

- **App icon:** `dokon/` papkasidagi 512×512 fayl
- **Feature graphic:** `dokon/` papkasidagi 1024×500 fayl
- **Screenshots:** `dokon/` papkasidagi namunalar (kamida 2 ta, 1080×1920
  o'lchamda tayyor)
- **Short description / Full description:** matnlar
  `docs/play-market.md` faylida tayyor — ko'chirib qo'ying

### Majburiy bo'limlar (bularsiz yuborib bo'lmaydi)

Chap menyu: **Policy and programs → App content**

| Bo'lim | Nima kiritiladi |
|---|---|
| **Privacy policy** | `https://samarali-kun.uz/maxfiylik` |
| **App access** | "All functionality is available without special access" (hisobga kirish Google orqali, qo'shimcha parol kerak emas) |
| **Ads** | Yo'q ("No, my app does not contain ads") |
| **Content rating** | So'rovnomani to'ldiring — zo'ravonlik/qo'pol tilsiz oddiy mahsuldorlik ilovasi, eng yengil toifaga tushadi |
| **Target audience** | 13 yosh va kattalar (bolalar uchun maxsus toifa EMAS) |
| **Data safety** | Qaysi ma'lumot yig'ilishini belgilang: email, ism — hisobga bog'lanish uchun; boshqa (joylashuv, kontaktlar va h.k.) — YO'Q. "Data is encrypted in transit" — Ha. "Users can request data deletion" — Ha, `/hisobni-ochirish` havolasini bering |
| **Government apps** | Yo'q |
| **Financial features** | Yo'q |

---

## 5-QISM: 12 ta sinovchi, 14 kun — MAJBURIY (shaxsiy hisob uchun)

Google qoidasi: **shaxsiy (yakka) Play Console hisobi** ilovasini
**ommaga (production)** chiqarishdan oldin kamida **12 kishi** uni
**ketma-ket 14 kun** davomida sinab ko'rishi kerak (**Closed testing**
bosqichida). Buni tashlab o'tib bo'lmaydi.

### Qanday tashkil qilish

1. Chap menyu: **Testing → Closed testing** → **Create track** (yoki
   mavjud trackni tanlang)
2. **Testers** bo'limida email ro'yxati yarating — kamida 12 ta
   HAQIQIY Gmail manzili (do'stlar, oila, hamkasblar — "sinab ko'rib,
   fikr bildiring" deb so'rang)
3. Shu trackka AAB yuklang (4-QISM dagidek)
4. Testerlarga **havola** beriladi (Play Console o'zi yaratadi) —
   ularga yuboring, ular o'sha havola orqali ilovani "testerlik"
   maqomida o'rnatadi
5. Google'ning o'zi kuzatadi: kamida 12 kishi ilovani o'rnatgan va
   **14 kun** o'tgan bo'lishi kerak — shundan keyingina "Production"ga
   o'tish tugmasi faollashadi.

**Maslahat:** shu 14 kunni bekorga sarflamang — aynan shu paytda real
telefonlarda sinab, xatolarni tuzatib ulguring.

---

## 6-QISM: Target API darajasi — tekshirildi, hozircha muammo yo'q

Google Play har yili (odatda avgustda) yangi ilova/yangilanishlar
uchun minimal "target API" talabini ko'taradi. **Hozir (2026-noyabr)
talab: Android 16, ya'ni API 36.**

Loyiha allaqachon shu darajada sozlangan
(`android/variables.gradle` faylida `targetSdkVersion = 36`) — **hech
narsa qilish kerak emas**. Keyingi yillarda ilovani yangilayotganda,
agar Play Console "target API darajangiz eskirgan" deb ogohlantirsa,
menga ayting — shu faylda bir raqamni o'zgartirib, qayta build
qilaman.

---

## 7-QISM: Ilovani yangilash (kelgusida)

Har safar yangi versiya chiqarganda:

1. `android/app/build.gradle` faylini oching (yoki menga "versiyani
   oshir" deng — men qilib beraman):
   - `versionCode` — 1 ga oshiring (masalan 1 → 2). Bu **ko'rinmas**
     raqam, faqat Google uchun.
   - `versionName` — foydalanuvchiga ko'rinadigan raqam (masalan
     "1.0" → "1.1").
2. `npm run build:app`
3. Android Studio: **Build → Generate Signed Bundle / APK** →
   **Android App Bundle** → Key store path'da **"Choose existing..."**
   bosib, `.secrets\samara-release.jks` faylni tanlang (parolni
   kiriting) → **Finish**.
4. Play Console → **Production** (yoki qaysi trackda bo'lsangiz) →
   **Create new release** → yangi AAB yuklang → **Save** → **Review** →
   **Start rollout**.

---

## 8-QISM: App Store (Apple/iPhone) — qisqa yo'l xaritasi

Bu qism hozir boshlanmagan — faqat nima kerak bo'lishini bilib
turishingiz uchun:

1. **Apple Developer Program** — yillik **$99** to'lov, ro'yxatdan
   o'tish 1-2 kun davom etishi mumkin (shaxsni tasdiqlash talab
   qiladi).
2. **Mac kerak** — sizda yo'q. Ikki yo'l bor:
   - Bulutdagi Mac build xizmati (masalan Codemagic, Ionic Appflow) —
     pullik, lekin Mac sotib olishdan arzon;
   - Yoki bir martalik ijaraga Mac (MacinCloud va shunga o'xshash).
3. **Sign in with Apple** — Apple qoidasi (4.8-band): Google bilan
   kirish bo'lgan ilovada Apple bilan kirish ham BO'LISHI SHART. Kod
   allaqachon tayyor (`docs/apple-kirish.md`), faqat Apple tomonda
   sozlash (Service ID, kalit) va `NEXT_PUBLIC_APPLE_KIRISH=1`
   yoqish kerak.
4. Qolgan qadamlar (ikonka, skrinshotlar, App Store Connect ro'yxati)
   Play Market'dagiga juda o'xshash — Apple Developer hisobi
   ochilgandan keyin men to'liq qo'llanma yozib beraman.

---

## Qisqa eslatma — nima qayerda

| Narsa | Qayerda |
|---|---|
| Android loyihasi | `android/` |
| Keystore (SIZ yaratasiz) | `.secrets\samara-release.jks` |
| Do'kon matnlari | `docs/play-market.md` |
| Grafika (ikonka, skrinshot) | `dokon/` |
| Play Console qadamlari (hisob ochish) | `docs/play-market-qadamlar.md` |
| Offline tekshirish ro'yxati | `docs/offline.md` |
