# Samara — loyiha holati (yangi chat uchun xulosa)

> Bu fayl yangi suhbatga nusxalab tashlash uchun. Oxirgi yangilanish:
> 2026-yil 21-noyabr.

> ⚠️ **MUHIM: hozir `main` emas, `feature/capacitor-offline`
> branch'idasiz.** Bu branch'da Capacitor (Android/iOS app), offline
> rejim va boshqa katta o'zgarishlar bor — hech biri `main`ga
> qo'shilmagan, hech biri GitHub'ga push qilinmagan, commit ham
> qilinmagan (foydalanuvchi aniq so'ramaguncha). Pastdagi "Ishlash
> tartibi"dagi `git push origin main` qoidasi SHU branch'ga tegishli
> emas — committing/push haqida avval so'rang.

## Loyiha

**Samara** — o'zbek tilidagi kunlik vazifalar ilovasi (Todoist uslubida).
Bepul, reklamasiz, kuzatuv tizimlarisiz.

- **Papka:** `C:\Users\user\Desktop\Vazifalar ilovasi`
- **Domen:** https://samarali-kun.uz (Vercel)
- **GitHub:** haziniy-dasturchi/Vazifalar-ilovasi, `main` shoxchasi
- **Supabase loyihasi:** `eypmgzfccyesfbcsqahw` (EU West, Irlandiya)
- **Aloqa/do'kon emaili:** haziniyilmmaskani2025@gmail.com

## Texnologiyalar

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v4
(`@theme` tokenlari) · TanStack Query v5 (offline-first) · Supabase
(Postgres + RLS + Edge Functions + pg_cron) · Vercel

## Kod konventsiyalari — MUHIM

- **Hamma nom o'zbekcha:** `vazifa`, `papka`, `bolim`, `yaratish`,
  `yangilash`, `ochirish`, `korsat`, `yop`. Yangi kod ham shunday
  bo'lsin.
- **Izohlar "nima" emas, "nega" ni tushuntiradi.** Ayniqsa nostandart
  qarorlar sababini yozish kerak.
- **Fayllar CRLF** bilan. Ko'p qatorli `sed`/`node` almashtirishlari
  shuning uchun tez-tez ishlamay qoladi — Edit vositasini ishlatgan
  ma'qul.
- Foydalanuvchiga ko'rinadigan matnlar o'zbek tilida, tipografik
  apostrof (`'`) bilan.

## Ishlash tartibi (shu paytgacha tutilgan)

1. Har o'zgarishdan keyin: `npx tsc --noEmit` va `npx next build`
2. Brauzerda haqiqiy tekshiruv (`preview_start` + `javascript_tool`)
3. Commit xabari: nima qilingani, **nega**, va **nima tekshirilgani**
4. `git push origin main` → deploy'ni build ID o'zgarishi bilan
   tasdiqlash
5. Tekshirilmagan narsani "ishlaydi" deb aytmaslik — ochiq aytish

Sinov uchun vaqtinchalik sahifa ochilsa (`app/sinov-*`), ish tugagach
**o'chiriladi** va middleware'dagi ochiq yo'l ham qaytariladi.

---

# Tugallangan ishlar

| Commit | Nima |
|---|---|
| `d712739` | Sana tanlash Todoist naqshida (telefonda pastki varaq, kompyuterda 340px panel) + push bildirishnomalar |
| `37624d9` | Mac/iOS sessiyasi tuzatildi, qator matni 4 qatorga, bildirishnoma eslatmasi |
| `01b8045` | Loyiha (bo'lim) qo'shishdagi xato |
| `d3c0575` | Huquqiy sahifalar + assetlinks |
| `c1153c4` | Do'kon grafikasi + domen |
| `4dbe089` | Apple bilan kirish (yashirin) + yo'riqnomalar |
| `897becd` | Hisobni o'chirish ishga tushdi |
| `66d5814` | Play Market yo'riqnomasi tuzatildi (12 sinovchi) |
| `9819771` | Sozlamalar sahifasi, qorong'i mavzu, sana tanlagich tuzatishlari |
| `7438dcc` | Qorong'ida kulrang matn kontrasti AA darajasiga ko'tarildi |
| `34c5f4d` | Avatar almashtirilganda eski fayl o'chadi |
| `5fee25f` | iPhone'da o'rnatish yo'riqnomasi aniqlashtirildi |
| `f5bda0c` | Hisobot: "Qisman bajarilgan ishlar" filtri tuzatildi + vitest qo'shildi |
| `965bf9a` | Loyihalar holat bo'yicha uchta guruhga bo'lindi |
| `a1a8b09` | Vazifa izohi (description) interfeysga chiqarildi |
| `ce9b834` | Takrorlanish RFC 5545 RRULE ga o'tdi (custom qoida) |
| `f1f91bd` | Kalit so'zlar bilan tez kiritish (Todoist uslubida) |
| `a49cf40` | Offline: klient UUID, yumshoq o'chirish, last-write-wins |
| `4170f09` | Migratsiyalarni lokal tekshiruvchi vosita (PGlite) |

## Testlar

`npm test` — vitest, faqat sof mantiq (jsdom yo'q): takrorlanish
hisobi, kalit so'z parseri, hisobot filtri, loyiha guruhlari,
havolalar. Hozir 139 ta test.

`cd tools && node migratsiya-sinov.mjs` — barcha migratsiyalarni
PGlite ustida qo'llab ko'radi, bulutga tegmasdan.

## Muhim texnik qarorlar va sabablari

**Takrorlanish — RRULE.** Qoida `tasks.rrule` da RFC 5545 matni
sifatida, boshlanish sanasi `tasks.rrule_start` da (alohida, chunki
`due_date` har bajarilganda suriladi, COUNT/UNTIL esa o'zgarmas
nuqtadan sanalishi kerak). Keyingi sana MIJOZDA hisoblanadi va
`complete_task` ga `p_next_due` orqali beriladi — aks holda
internetsiz bajarilgan takrorlanuvchi vazifa surilmasdi. Eski
`recurrence` ustuni orqaga moslik uchun to'ldirib boriladi
(PWA keshidagi eski JS hamon o'qiydi).

**29–31-sana.** Qisqa oyda oyning oxirgi kuniga tushadi. Bu
standartdan chetga chiqish emas: `BYMONTHDAY=28,29,30,31` +
`BYSETPOS=-1` aynan shuni beradi.

**Offline yozish — ikkinchi bosqich.** Klient tomonida UUID (`lib/id.ts`) — shuning
uchun offline qo'shilgan vazifani darhol tahrirlash va o'chirish
mumkin. O'chirish yumshoq (`deleted_at`), konflikt last-write-wins
(`updated_at` bo'yicha, `.lte('updated_at', mijozVaqti)` shartida).
Tafsilot: `docs/offline.md`.

**Offline yozish.** Mutatsiya funksiyalari React'dan tashqarida,
`lib/queries/mutatsiya-sozlamalari.ts` da, barqaror `mutationKey`
bilan ro'yxatdan o'tadi. Shunda internetsiz qilingan o'zgarish
IndexedDB'ga saqlanadi va ilova qayta ochilganda yuboriladi.
→ Argument tiplari **shu faylda** e'lon qilinadi va hook ham, mutationFn
ham aynan shularni ishlatadi. Avval ular uzilgan edi va "Bo'lim
qo'shilmadi" xatosini TypeScript ushlamagan.

**Mac/iOS sessiyasi.** Safari JavaScript yozgan kukiga 7 kun muddat
qo'yadi. Shuning uchun `lib/supabase/middleware.ts` har so'rovda
sessiya kukisini **server nomidan** qayta yozadi (400 kun). Shuningdek
tarmoq nosozligi bilan "refresh token yaroqsiz" ajratiladi — birinchisida
foydalanuvchi chiqarib yuborilmaydi.

**Bildirishnomalar.** `due_time` mahalliy soat, shuning uchun
`profiles.timezone` da talqin qilinadi. pg_cron har daqiqada
`eslatma-yuborish` Edge Function'ini chaqiradi. Yuborilmasa
`notified_at` belgilanmaydi — keyingi daqiqada qayta urinadi.
Bir soatdan eski eslatmalar yuborilmaydi.

**Apple bilan kirish.** Kod tayyor, lekin `NEXT_PUBLIC_APPLE_KIRISH=1`
bo'lmasa **yashirin**. Sababi: Apple Developer a'zoligi ($99/yil) va
Apple tomonida sozlashsiz tugma ishlamaydi.

**Mavzu (yorug'/qorong'i).** Ranglar `app/globals.css` da oddiy CSS
o'zgaruvchilari, `@theme inline` orqali Tailwind'ga bog'langan. Shu
sababli komponentlarda `dark:` sinfi ISHLATILMAYDI — faqat
o'zgaruvchilar almashadi. Yangi rang qo'shilsa, u ham shu yo'l bilan
berilishi kerak.
→ `--brand-onsoft` alohida token: qorong'ida to'ldirilgan tugma oq
matn uchun to'q (`#047857`), yuzadagi matn esa yorug' (`#6ee7b7`)
bo'lishi shart. Yorug' mavzuda ikkisi bir xil qiymatda.
→ Tanlov localStorage'da (chizilishdan oldin o'qiladi, oq chaqnash
bo'lmaydi) va `profiles.theme` da (qurilmalar orasida) saqlanadi.

**Yon panel tartibi.** `profiles.sidebar_order` — bo'sh massiv "sukut
tartib" degani. Ataylab shunday: kelajakda yangi bo'lim qo'shilsa, u
avtomatik ro'yxatga tushadi. To'liq ro'yxat yozib qo'yilsa, eski
foydalanuvchilar yangi bo'limni ko'rmay qolardi.

**Avatar.** `avatarlar` storage bucket, fayl yo'li `<user_id>/<nom>`
— RLS shu birinchi papkaga qarab ruxsat beradi. Yangisi yuklangach
eskisi o'chiriladi, aks holda har almashtirish fayl qoldirardi.

**Native push bildirishnoma (FCM).** Appda Web Push ishlamaydi
(`PushManager` Capacitor WebView'da yo'q), shuning uchun
`push_subscriptions` jadvali ikki turni saqlaydi: `platform='web'`
(endpoint/p256dh/auth) va `platform IN ('android','ios')`
(`fcm_token`). CHECK constraint platformaga mos ustunlar
to'ldirilganini bazada kafolatlaydi — aks holda xato faqat
bildirishnoma yuborish paytida ko'rinardi.
→ Edge Function OAuth2 tokenni `jose` bilan O'ZI imzolaydi,
`firebase-admin` SDK ishlatilmaydi (Deno muhitida ortiqcha).
Token 1 soat keshlanadi; TUGAMAGAN so'rov ham keshlanadi, chunki
qurilmalarga `Promise.all` bilan parallel yuboriladi va aks holda
har biri uchun alohida OAuth2 so'rovi ketardi.

---

# `feature/capacitor-offline` branch'ida qilingan ishlar (2026-noyabr)

Bular hammasi `main`ga hali qo'shilmagan, alohida branch'da.

## 1. Capacitor — ilova (Android/iOS) qobig'i

- `capacitor.config.ts`: appId `uz.samaralikun.samara`, `webDir: 'out'`,
  `server.url` YO'Q (haqiqiy offline ishlashi uchun — sayt o'rami EMAS).
- **TWA/PWABuilder rejasi TO'XTATILDI**, Capacitor almashtirdi
  (`docs/play-market-qadamlar.md`, `docs/play-market.md` shunga mos
  yangilangan).
- `lib/platform.ts` — `ilovaNativemi()` — platformani aniqlashning
  YAGONA joyi. Butun kodda bor-yo'g'i 4 ta joy shunga tekshiradi:
  native Google kirish, sessiya saqlagich, offline banner matni,
  status bar/orqaga tugmasi. Boshqa HECH QAYERDA farq yo'q — veb va
  app bir xil kod ishlatadi.
- `scripts/build-capacitor.mjs` — `npm run build:app`: `middleware.ts`
  va `app/auth/callback`ni vaqtincha chetga olib statik eksport
  qiladi (ular appga kerak emas, middleware umuman ishlamaydi static
  export'da). `next.config.ts`da `trailingSlash: true` ShART —
  aks holda appda sahifalar orasida yurish ishlamaydi (Next statik
  eksportda `/bugun/index.html` yaratadi, lekin havolalar "/" siz
  bo'ladi — Capacitor buni hal qila olmay, boshidagi sahifaga
  qaytarib yuborardi). Bu **real xato edi, tuzatildi**.
- `app/(ilova)/papka/[id]/page.tsx` — `generateStaticParams()` bitta
  zaxira yo'l qaytaradi, haqiqiy ID `useParams()` orqali client
  tomonda olinadi (real papka ID'lari build vaqtida noma'lum).
- `app/kirish/page.tsx` — `searchParams` server o'qishi olib
  tashlandi (statik eksportda ishlamaydi), `useSearchParams()` +
  Suspense'ga ko'chirildi.
- Native Google kirish: `lib/google-kirish.ts`, `@capgo/capacitor-social-login`.
  Nonce TO'G'RI ishlatilgan (Google'ga xashlangan, Supabase'ga xom).
  Google Cloud Console'da **Android OAuth client allaqachon
  yaratilgan** ("Samara Android debug", debug SHA-1 bilan — Vazifalar
  loyihasi, `haziniyilmmaskani2025@gmail.com` hisobida). **Telefonda
  sinaldi — ishladi.**
- Sessiya: `@capacitor/preferences` (appda), kuki (veb'da) —
  `lib/supabase/client.ts`.
- `@capacitor/network` — `onlineManager`ga ulangan
  (`components/app/native-bootstrap.tsx`) — WebView'da
  `navigator.onLine` ishonchsiz bo'lgani uchun.
- Status bar, Android orqaga tugmasi, safe-area — hammasi
  `native-bootstrap.tsx` + CSS `env(safe-area-inset-*)`.
- Ikonka/splash — `assets/icon.svg` (brend belgisidan, xavfsiz hudud
  bilan qayta ishlangan) + `@capacitor/assets`.

## 2. Offline rejim

- **Appda**: to'liq (allaqachon TanStack mutatsiya-navbat arxitekturasi
  bor edi, shunchaki tasdiqlandi va kuchaytirildi).
- **Veb'da**: offline'da FAQAT ko'rish. `lib/queries/outbox-mutatsiya.ts`
  (`useOutboxMutation`) — barcha vazifa/papka/bo'lim/profil
  mutatsiyalari shu orqali o'tadi (11 joy). Veb+offline bo'lsa so'rov
  UMUMAN yuborilmaydi, `components/app/offline-tahrirlash-oynasi.tsx`
  ochiladi.
- `components/app/offline-belgisi.tsx` qayta yozildi: qora/qizil
  o'rniga yumshoq kulrang, platforma bo'yicha matn farqlanadi.
- **MUHIM XATO TOPILDI VA TUZATILDI:** vazifa holati (boshlash/rejaga
  qaytarish) o'zgarganda "Bugun/Jarayonda/Kelgusi/Ertaga" ro'yxatlariga
  qo'shilmas/chiqarilmas edi (`keshdaYangila` faqat MAVJUD yozuvni
  yangilardi, ro'yxatga qo'shish/chiqarishni bilmasdi). Onlayn paytda
  sezilmasdi (darhol qayta yuklanardi), offline'da ochiq ko'rinardi.
  `lib/queries/vazifalar.ts`dagi `royxatlarniKochir()` funksiyasi hal
  qildi. **Telefonda tasdiqlandi — ishlayapti.**
- `docs/offline.md` to'liq qayta yozildi (A/B/C bo'lim: veb, app,
  uzoq muddat offline sessiya testi).

## 3. Native push bildirishnoma (FCM) — BAJARILDI

Firebase loyihasi: **`samara-88f9a`** (`haziniyilmmaskani2025@gmail.com`
hisobida, Spark/bepul reja). Android ilova `uz.samaralikun.samara`
nomi bilan ro'yxatdan o'tgan.

- `@capacitor/push-notifications` o'rnatildi,
  `android/app/google-services.json` joylashtirildi (gradle allaqachon
  shu fayl bo'lsa plaginni qo'llaydigan qilib sozlangan edi).
- `AndroidManifest.xml` ga `POST_NOTIFICATIONS` qo'shildi. Plagin bu
  ruxsatni Java kodida so'raydi, lekin o'z manifestida e'lon
  QILMAYDI — busiz Android 13+ da ruxsat oynasi umuman chiqmasdi.
- Migratsiya `20261121100000_fcm_push.sql` — **production'ga
  qo'llangan** (21-noyabr). `platform` + `fcm_token` ustunlari,
  eski ustunlar nullable, CHECK constraint, `fcm_token` uchun
  qisman noyoblik indeksi.
  → Ikkala RPC (`kutilayotgan_eslatmalar`, `kutilayotgan_topshiriqlar`)
  DROP+CREATE qilindi (RETURNS TABLE o'zgargani uchun). **Bu ACL'ni
  tashlab yuboradi**, shuning uchun `service_role` ga EXECUTE
  qaytadan berildi — busiz Edge Function "permission denied" olardi.
- `lib/bildirishnoma.ts` — platformaga qarab ajraladi. Appda token
  `register()` dan QAYTMAYDI, `'registration'` hodisasi orqali
  keladi — shuning uchun promise bilan o'ralgan va
  `@capacitor/preferences` da saqlanadi (brauzerdagi kabi
  `getSubscription()` yo'q, aks holda holatni bilish uchun har safar
  foydalanuvchiga ruxsat oynasi ko'rsatilardi).
- `native-bootstrap.tsx` — bildirishnoma bosilganda `data.yol`
  bo'yicha o'tadi (`/bugun` yoki `/topshiriqlar`).
- Edge Function **deploy qilingan**, sir `FIREBASE_SERVICE_ACCOUNT`
  Supabase'ga qo'shilgan (JSON nusxasi `.secrets/` da).

**Tekshirilgani:** OAuth2 zanjiri haqiqiy service account bilan
sinaldi — token olindi (200), FCM API uni qabul qildi va faqat soxta
qurilma tokenidan shikoyat qildi (`INVALID_ARGUMENT`). RPC imzolari
va `service_role` ruxsatlari bazada tasdiqlandi. `tsc`, `next build`,
139 test, `build:app` — hammasi o'tdi.

**Tekshirilmagani:** haqiqiy telefonga bildirishnoma YETIB BORISHI.

## 4. Bajarishni bekor qilish — BAJARILDI (24-noyabr)

"Bugun bajarildi" dagi vazifani doirasini qayta bosib ochiq ishlarga
qaytarish. Oddiy vazifada bu avval ham ishlardi, TAKRORLANUVCHIDA esa
doira umuman o'chirib qo'yilgandi: bajarilgan zahoti server uni
keyingi sanaga suradi va holati "done" bo'lib qolmaydi.

- Migratsiya `20261124090000_bajarishni_bekor.sql` — **qo'llangan**.
  Yangi ustun `tasks.prev_due_date` (surishdan oldingi sana) va yangi
  `undo_complete_task()` RPC. Eski `uncomplete_task` o'z joyida
  qoldirildi — telefon keshidagi eski JS uni chaqirishi mumkin.
- Bekor qilinganda jurnaldagi `completed` yozuvi O'CHIRILADI. Nega:
  bu tugma "adashib bosdim" uchun — aks holda hisobotda o'sha kun
  "bajarilgan" bo'lib qolaverardi, "Bugun" sahifasi esa vazifani
  ham ochiq ro'yxatda, ham bajarilganlar orasida ikki marta
  ko'rsatardi (u sahifa aynan shu yozuvga qarab ishlaydi).
- Eski yozuvlarda (`prev_due_date` bo'sh) oxirgi "bajarildi"
  hodisasining kuniga qaytariladi.
- **TOPILDI:** production'dagi `tg_tasks_progress_sync` triggeri
  repo'dagi migratsiyalardan farq qilardi — bazada qo'lda tuzatilgan,
  fayli yozilmagan. Lokal PGlite sinovi shu sababli eski, buzuq
  variantni sinardi. Jonli variant endi migratsiyaga ko'chirildi
  (production uchun o'zgarish yo'q).

**Tekshirilgani:** PGlite'da 12 ta yangi tekshiruv (surish, orqaga
qaytish, muddat siljishi, hodisa o'chishi, eski yozuv, takroriy
chaqiruv), `tsc`, `next build`, 139 test, `build:app`.

**Tekshirilmagani:** interfeysda bosib ko'rish (kirish parolini
Claude kirita olmaydi).

**Ma'lum kamchilik:** bekor qilinganda subtasklar "planned" bo'lib
qolaveradi — bajarishdan oldin qaysilari belgilangani saqlanmaydi.

## 4b. Topshiriqlar, 1-bosqich — BAJARILDI (24-noyabr)

Maqsad: rahbar xodimlarga topshiriq berib, bajarilishini shu ilovada
nazorat qilsin.

- Migratsiya `20261124150000_topshiriq_tekshiruv.sql` — **production'ga
  qo'llangan** (Management API, bitta tranzaksiyada).
- Yangi holat `tekshiruvda`: kutilmoqda → qabul → tekshiruvda →
  bajarildi; yuboruvchi `topshiriqni_qaytarish` bilan sabab yozib
  qaytaradi (ijrochi vazifasi yana `in_progress` bo'ladi).
  Ijrochi `topshiriqni_topshirish` (natija izohi bilan) yoki vazifani
  ro'yxatida tugatadi — trigger ikkalasida bir xil ishlaydi.
- `tekshirish` ustuni: har topshiriqda yuboruvchi tanlaydi (sukut:
  true). Eski 6 ta qatorga `false` qo'yildi — yarim yo'lda oqim
  o'zgarmasin.
- `muddat_vaqt` (soat), qabulda `izoh` va soat ham vazifaga ko'chadi.
- `topshiriq_kontaktlari()` — ism faqat `topshiriq_tafsilotlari`
  qoidasi bo'yicha (men yozgan odam ismi u qabul qilgandan keyin).
- `kutilayotgan_topshiriqlar()` ga `fcm_push` da tushib qolgan
  `qabul_ochirgan_at is null` sharti qaytarildi.
- Interfeys: kontakt chiplari, Telegram taklif havolasi, holat
  filtrlari (Kechikkan bilan), menyu belgisi = kutilayotgan kelganlar
  + tekshiruvdagi yuborilganlar.

**Tekshirilgani:** PGlite'da 13 ta yangi tekshiruv, `tsc`, 139 test,
production'da ustunlar/CHECK/RPC ruxsatlari.

**Tekshirilmagani:** interfeysda bosib ko'rish; Android'da taklif
tugmasi (WebView'da `navigator.share` bo'lmasa t.me havolasi ochiladi).

## 4c. Topshiriqlar, 2-3-bosqich — BAJARILDI (24-noyabr)

main'ga `abc4eb0` (Vercel'da jonli). Faqat topshiriqlar fayllari
ko'chirilgan — Capacitor/offline ishi bu branch'da qolgan.

- Migratsiya `20261125090000_topshiriq_jamoa.sql` — **production'ga
  qo'llangan**. Jamoalar (havola kodi bilan, rahbar/a'zo),
  `profiles.taklif_kodi` + `kontaktlar` (shaxsiy taklif), izohlar
  (`topshiriq_izohlari`, RLS), yopiq bucket `topshiriq-fayllar`
  (10 MB), `topshiriq_tarixi` (trigger), `topshiriq_xabarlari`
  navbati, `guruh_id`, `takror`, `baho`, `avto_qabul`.
- Jamoa ichida `tg_topshiriq_avto_qabul` darhol qabul qiladi;
  `topshiriq_yozsa_boladimi` jamoadoshga doim ruxsat beradi.
- Trigger nomi `topshiriq_0_hodisa` — ATAYLAB "0": Postgres
  triggerlarni nom tartibida ishlatadi, "yuborildi" yozuvi
  avtomatik qabuldan oldin tushishi kerak.
- Edge Function `eslatma-yuborish` **joylangan**: uchinchi ish —
  `topshiriq_muddat_xabarlari()` (2 soat qolganda / o'tganda) va
  navbatdagi xabarlarni yuborish. Birinchi ishga tushishda 5 xabar
  yetkazildi.
- Middleware `keyin` endi so'rov qismini ham saqlaydi
  (`?jamoa=`/`?taklif=` kirishdan keyin yo'qolmasin); auth
  callback'da `//` ochiq yo'naltirish yopildi.
- PGlite sinovi endi `set role authenticated` bilan RLS'ni ham
  tekshiradi (stub'ga Supabase'dagi default privileges qo'shildi).

**Tekshirilgani:** PGlite'da 31 yangi holat, production'da
jadvallar/RLS/ruxsatlar, tsc, 143 test, next build, interfeys
namunaviy ma'lumot bilan (vaqtinchalik `app/sinov-topshiriq`,
o'chirildi), debug APK yig'ildi.

**Tekshirilmagani:** haqiqiy ikki hisob bilan butun oqim; fayl
yuklash Storage'da; Android'da ulashish tugmasi.

**Keyingi:** release (imzolangan) build; ilovada havolalar ilovani
ochishi uchun `assetlinks` (ANDROID_SHA256).

## 4d. Topshiriqlar: qayta dizayn va soddalashtirish — BAJARILDI (24-noyabr)

main'ga `9738c89` (Vercel'da jonli). Foydalanuvchi talabi.

- Migratsiya `20261125120000_topshiriq_soddalash.sql` — **production'ga
  qo'llangan**. Qabul/rad bosqichi YO'Q: `tg_topshiriq_avto_qabul`
  hammaga (ro'yxatdan o'tmaganlar — Kiruvchi papkasi yaratilganda,
  `folders` triggeri). `boshlanish` -> `tasks.due_date`, `muddat` ->
  `tasks.deadline`. `topshiriqni_tahrirlash` (ijrochi vazifasini ham
  yangilaydi). `topshiriq_korilgan` + `topshiriq_yangiliklari()` —
  o'qilmagan xabarlar. Spam: begonadan ochiq topshiriqlar <= 20.
  `kutilayotgan_topshiriq_xabarlari()` endi `topshiriq_id` qaytaradi —
  push bosilsa `/topshiriq?id=` ochiladi (Edge Function joylangan).
- Interfeys: `components/topshiriq/` — karta (UstozCRM naqshi), holat
  ranglari (`holat.ts`), alohida sahifa `/topshiriq?id=` (ID so'rov
  qismida — statik eksport uchun), chat (rasm/video/fayl/ovoz —
  MediaRecorder; AndroidManifest'ga RECORD_AUDIO), sana oralig'i
  kalendari (`components/ui/oraliq-kalendar.tsx`), taklif oynasi
  (Telegram / nusxa / boshqa — `navigator.share` ayrim joyda chiqmasdi).
- Jamoa UI olib tashlandi (baza qismi qoldi).

**Tekshirilmagani:** ikki haqiqiy hisob bilan; ovozli xabar telefonda.

**Diqqat:** 24-noyabrda `node_modules/vitest` ichida bitta bayt
buzilgan edi (0x0A -> 0x8A, bit almashishi) — tiklandi. Takrorlansa,
disk/xotirani tekshirish kerak.

## 5. Hali qilinmagan / ma'lum kamchiliklar

- iOS push — kod tayyor, lekin APNs kaliti (Apple Developer a'zoligi)
  va Firebase'da iOS ilova sozlanmagan. Mac ham yo'q.
- iOS — faqat fayl tuzilishi, Mac yo'qligi sababli build/test
  qilinmagan.
- Android Gradle haqiqiy kompilyatsiyasi avtomatik tekshirilmagan edi
  (JDK yo'q edi bu muhitda), lekin foydalanuvchi o'z Android
  Studio'sida muvaffaqiyatli build+run qildi.
- ESLint sozlanmagan (`next lint` interaktiv so'rov beradi) —
  loyihada hech qachon sozlanmagan, bu ishga aloqasi yo'q.

---

# Native push (FCM) — tegishli fayllar

- `lib/bildirishnoma.ts` — mijoz kodi. Veb → Web Push, app → FCM.
- `supabase/migrations/20261121100000_fcm_push.sql` — `platform`/`fcm_token`.
- `supabase/functions/eslatma-yuborish/index.ts` — ikkala yo'l
  (`bittaYubor()` platformaga qarab ajratadi).
- `components/app/native-bootstrap.tsx` — bildirishnoma bosilishi.
- `components/app/bildirishnoma-eslatmasi.tsx` — "yoqish" taklifi UI'si.

**Keyingi qadam:** telefonda sinash — Sozlamalar → Bildirishnoma →
yoqish, so'ng vazifaga yaqin vaqt qo'yib, ilovani YOPIB kutish.

---

# Hozirgi vazifa: Play Market'ga chiqarish

## Sozlamalar sahifasi (`/sozlamalar`)

Profil menyusidan ochiladi (kompyuterda yon panel pasti, telefonda
yuqori o'ng burchak). Besh bo'lim: profil (rasm, ism), umumiy (vaqt
mintaqasi), ko'rinish, yon panel tartibi, bildirishnoma.

Bazaga `20261113090000_sozlamalar.sql` migratsiyasi **qo'llangan**
(13-noyabr): `profiles.sidebar_order` ustuni va `avatarlar` bucket.

Supabase Auth → URL Configuration **tuzatilgan**: Site URL endi
`https://samarali-kun.uz`. Oldin u Vercel manziliga qo'yilgandi va
`samarali-kun.uz` da kirish boshqa domenga tashlab yuborardi — bu
Play Market uchun to'siq edi, chunki Android ilovasi shu domenga
ishora qiladi.

## Kod tomonidan TAYYOR

- `/maxfiylik`, `/shartlar`, `/hisobni-ochirish` — kirishsiz ochiladi
  (do'kon robotlari login qila olmaydi)
- Hisobni o'chirish — ilova ichida (Ko'rish → Hisob) va bazada
  (`hisobni_ochirish()` RPC, kaskad bilan hamma ma'lumot o'chadi)
- `/.well-known/assetlinks.json` — `ANDROID_SHA256` muhit
  o'zgaruvchisini kutyapti, hozir bo'sh `[]` qaytaradi
- `dokon/` papkasida: ikonka 512×512, feature graphic 1024×500,
  4 ta skrinshot 1080×1920 (namunaviy ma'lumot bilan)
- Do'kon matnlari tayyor (`docs/play-market.md`)

## Foydalanuvchi bajaradigan ishlar

`docs/play-market-qadamlar.md` da 10 qadam. Hozirgi holat:
**1-qadam — Play Console hisobi ochilmoqda.**

Muhim faktlar:
- **Yakka hisob** (tavsiya etilgan): D-U-N-S kerak emas, lekin
  production'dan oldin **12 sinovchi × 14 kun** yopiq sinov majburiy
- **Tashkilot hisobi:** 12 sinovchi talabi yo'q, lekin D-U-N-S
  30 kungacha ketadi
- To'lov: $25 bir martalik, **UzCard/Humo ishlamaydi** — xalqaro
  to'lovlari yoqilgan Visa/Mastercard kerak

## Men (Claude) keyin nima qilaman

Foydalanuvchi PWABuilder bilan paket yasagach, **SHA-256 barmoq izini**
yuboradi → Vercel'ga `ANDROID_SHA256` qo'shiladi → `assetlinks.json`
tekshiriladi.

---

# Ochiq masalalar

1. **Push bildirishnoma haqiqiy qurilmaga yetib borishi tasdiqlanmagan.**
   Server zanjiri to'liq tekshirilgan (vaqt mintaqasi, takrorlanmaslik,
   cron), lekin yuborish faqat soxta obuna bilan sinalgan.
   Haqiqiy telefonda tekshirish kerak.
2. **App Store yo'li boshlanmagan.** Apple Developer hisobi ham, Mac
   ham yo'q. Qoida 4.2 (shunchaki sayt o'rami rad etiladi) va 4.8
   (Apple bilan kirish majburiy) sababli jiddiy ish talab qiladi.
3. **YORUG' mavzuda kulrang matn kontrasti past.** `--text-faint`
   (`#9ca3af`) oq fonda 2.5:1 beradi, WCAG AA esa 4.5:1 talab qiladi;
   `--text-muted` ham 4.43:1 bilan chegarada. Bu loyihaning ASL
   palitrasidan kelgan, qorong'i mavzu bilan bog'liq emas (qorong'ida
   tuzatilgan). Tuzatish butun ilovaning ko'rinishini o'zgartiradi —
   kulrang yozuvlar sezilarli to'qlashadi — shuning uchun dizayn
   qarori sifatida foydalanuvchiga qoldirildi.
4. **iPhone'da o'rnatishni dastur boshlay olmaydi.** iOS Safari'da
   `beforeinstallprompt` yo'q — bu Apple cheklovi, kod bilan
   aylanib o'tib bo'lmaydi. Faqat yo'riqnoma ko'rsatiladi.

# Maxfiy ma'lumotlar

`.secrets/` papkasida (`.gitignore` da, GitHub'ga tushmaydi):
`supabase-token.txt` (Management API, hozir ishlayapti),
`anon-key.txt`, `google-client-*.txt`,
`firebase-service-account.json` (FCM yuborish kaliti).
VAPID maxfiy kaliti va `FIREBASE_SERVICE_ACCOUNT` faqat Supabase
sirlarida.

`android/app/google-services.json` repo ICHIDA — unda faqat ommaviy
klient sozlamalari bor (Firebase buni normal deb hisoblaydi), maxfiy
kalit emas.

**Claude foydalanuvchining parolini kiritib hisobga kira olmaydi** —
bu qat'iy chegara. Kerak bo'lsa foydalanuvchi token beradi.
