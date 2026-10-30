# Serverga chiqarish

Ikki qism: **backend** (Supabase cloud) va **frontend** (Vercel).
Ikkalasi ham bulutda ishlaydi — kompyuteringiz o'chiq bo'lsa ham ilova ochiladi.

> **Maxfiy ma'lumotlarni chatga yozmang.** Parol, `service_role` kaliti va
> Google "Client secret" faqat sizning qo'lingizda qolsin. Pastdagi tartib
> shunga moslangan: har bir maxfiy qiymat o'zining joyiga to'g'ridan-to'g'ri
> kiritiladi.

---

## Qadam 1 — Supabase loyihasi (siz bajarasiz)

1. https://supabase.com/dashboard → **New project**
   - Name: `vazifalar`
   - Database Password: kuchli parol o'ylab toping va saqlab qo'ying
   - Region: `Central EU (Frankfurt)` (O'zbekistonga eng yaqinlaridan)
2. Loyiha tayyor bo'lgach **Project Settings → General → Reference ID** ni nusxalang
   (bu maxfiy emas, menga ayta olasiz).

Terminalda bir marta:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref SIZNING_REF
```

`link` buyrug'i ma'lumotlar bazasi parolini so'raydi — 1-qadamda o'ylab topganingizni kiriting.

---

## Qadam 2 — Migratsiyalarni yuklash

Shundan keyin men bajara olaman:

```bash
npx supabase db push
```

Natijada 11 ta migratsiya bulutdagi bazaga ko'chadi: 8 jadval, RLS siyosatlari,
triggerlar va RPC funksiyalar. `seed.sql` yuklanmaydi — u faqat lokal test uchun.

---

## Qadam 3 — Google bilan kirish (siz bajarasiz)

### 3.1 Google Cloud Console

1. https://console.cloud.google.com → yangi loyiha: `Vazifalar`
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Vazifalar`
   - Support email va developer email: o'zingizniki
   - Sinov bosqichida **Test users** ga o'z Gmail'ingizni qo'shing
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Type: **Web application**
   - Name: `Vazifalar web`
   - **Authorized redirect URIs** ga aynan shuni qo'shing:
     ```
     https://SIZNING_REF.supabase.co/auth/v1/callback
     ```
   - Saqlang va `Client ID` + `Client secret` ni oling

### 3.2 Supabase dashboard

**Authentication → Sign In / Providers**:

- **Google** ni yoqing, `Client ID` va `Client Secret` ni qo'ying → Save
- **Email** provayderini **o'chiring** (ilovada faqat Google bilan kirish bor)

---

## Qadam 4 — Vercel (deploy)

Terminalda bir marta:

```bash
npx vercel login
```

Keyin men bajara olaman: loyihani yarataman, muhit o'zgaruvchilarini qo'yaman
va ishlab chiqarishga chiqaraman.

Qo'yiladigan o'zgaruvchilar (ikkalasi ham ochiq, maxfiy emas):

| Nomi | Qiymati |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://SIZNING_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → `anon public` |

---

## Qadam 5 — Manzillarni ulash

Vercel manzili ma'lum bo'lgach (masalan `https://vazifalar.vercel.app`),
Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://vazifalar.vercel.app`
- **Redirect URLs** ro'yxatiga qo'shing:
  ```
  https://vazifalar.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

---

## Qadam 6 — Tekshirish

```bash
node tools/server-test.mjs https://SIZNING_REF.supabase.co ANON_KEY https://vazifalar.vercel.app
```

Skript tekshiradi: REST va Auth xizmatlari, Google provayderi yoqilganmi,
RLS begonaga ma'lumot bermasligi, kirish Google sahifasiga yo'naltirishi,
sayt ochilishi, kirmagan foydalanuvchi qaytarilishi, PWA manifesti va ikonka.

---

## Keyinchalik: o'zgarishlarni chiqarish

```bash
npx supabase db push    # baza o'zgarishlari
npx vercel --prod       # frontend
```
