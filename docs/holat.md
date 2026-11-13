# Samara — loyiha holati (yangi chat uchun xulosa)

> Bu fayl yangi suhbatga nusxalab tashlash uchun. Oxirgi yangilanish:
> 2026-yil 13-noyabr.

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

## Muhim texnik qarorlar va sabablari

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
`anon-key.txt`, `google-client-*.txt`.
VAPID maxfiy kaliti faqat Supabase sirlarida.

**Claude foydalanuvchining parolini kiritib hisobga kira olmaydi** —
bu qat'iy chegara. Kerak bo'lsa foydalanuvchi token beradi.
