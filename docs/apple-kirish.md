# Apple bilan kirish

Kod **tayyor** — iPhone va Mac foydalanuvchilari uchun «Apple bilan
davom etish» tugmasi yozilgan va ko'rinishi tekshirilgan.

Lekin u hozircha **yashirin**. Sababi quyida.

---

## Nega hozir yashirin

Apple bilan kirish ikki tomonlama sozlashni talab qiladi:

1. **Apple tomonida** — Service ID, maxfiy kalit va domenni tasdiqlash
2. **Supabase tomonida** — Apple provayderini yoqish

Bularsiz tugma bosilsa, foydalanuvchi xato sahifasiga tushadi. Ishlamaydigan
tugma umuman yo'q tugmadan yomonroq — shuning uchun u o'chirib
qo'yilgan.

**Eng muhimi:** Apple tomonidagi sozlash **Apple Developer Program**
a'zoligini talab qiladi — **yiliga $99**. Bu sizda hali yo'q.

---

## Qachon kerak bo'ladi

| Holat | Apple bilan kirish kerakmi |
|---|---|
| Faqat Play Market (hozirgi reja) | **Yo'q** |
| Sayt sifatida ishlatish | Yo'q (lekin foydali) |
| App Store'ga chiqarish | **Ha, majburiy** |

App Store qoidasi 4.8 aniq aytadi: Google bilan kirish taklif qilsangiz,
Apple bilan kirishni ham taklif qilishingiz **shart**. Busiz ariza rad
etiladi.

Ya'ni bu ish App Store haqida o'ylaganingizda kerak bo'ladi — hozir
emas.

---

## Yoqish tartibi (keyinroq uchun)

### 1. Apple Developer Program

[developer.apple.com/programs](https://developer.apple.com/programs/) —
$99/yil, shaxsni tasdiqlash bilan.

### 2. Apple tomonida sozlash

[developer.apple.com/account](https://developer.apple.com/account) →
**Certificates, Identifiers & Profiles**:

1. **App ID** yarating — masalan `uz.samaralikun.samara`,
   «Sign in with Apple» ni belgilang
2. **Services ID** yarating — masalan `uz.samaralikun.web`
   - *Domains:* `samarali-kun.uz`
   - *Return URLs:*
     `https://eypmgzfccyesfbcsqahw.supabase.co/auth/v1/callback`
3. **Key** yarating — «Sign in with Apple» ni belgilang, `.p8` faylni
   yuklab oling (**faqat bir marta beriladi**)
4. Quyidagilarni yozib qo'ying: **Team ID**, **Key ID**, **Services ID**

### 3. Supabase tomonida

Dashboard → **Authentication** → **Sign In / Providers** → **Apple**:

- *Enabled:* yoqing
- *Services ID:* `uz.samaralikun.web`
- *Team ID*, *Key ID*, va `.p8` fayl ichidagi matn

### 4. Tugmani ko'rsatish

Vercel → Project → Settings → **Environment Variables**:

| Nomi | Qiymati |
|---|---|
| `NEXT_PUBLIC_APPLE_KIRISH` | `1` |

So'ng **Redeploy** qiling. Tugma paydo bo'ladi.

### 5. Sinab ko'ring

iPhone yoki Mac'dan kirib ko'ring. Birinchi marta Apple «elektron
pochtangizni yashirasizmi?» deb so'raydi — foydalanuvchi yashirishni
tanlasa, bizga `@privaterelay.appleid.com` bilan tugaydigan manzil
keladi. Bu normal va ilova u bilan ham ishlayveradi.

---

## Nima tayyor, nima yo'q

| | Holat |
|---|---|
| Tugma kodi va ko'rinishi | ✅ tayyor, tekshirilgan |
| Kirish oqimi (callback) | ✅ tayyor — Google bilan bir xil yo'ldan o'tadi |
| Apple Developer a'zoligi | ❌ sizdan |
| Apple tomonidagi sozlash | ❌ sizdan (a'zolikdan keyin) |
| Supabase provayderi | ❌ sozlash ma'lumotlari kelgach, men qilaman |
