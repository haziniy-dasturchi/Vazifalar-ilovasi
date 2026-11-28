# Xayriya to'lovlari: Payme va Click'ni ulash

"Loyihani qo'llab-quvvatlash" sahifasidagi **Payme orqali to'lash** va
**Click orqali to'lash** tugmalari quyidagilar sozlangandan keyin ishlaydi.
Sozlanmagan tizimning tugmasi ko'rinmaydi.

## Qanday ishlaydi

1. Odam summani tanlab, tugmani bosadi. Ilova bazada "kutilmoqda"
   holatidagi xayriya ochadi (`xayriya_yarat`).
2. Payme yoki Click to'lov sahifasi ochiladi. Telefonda ilova o'rnatilgan
   bo'lsa, ilovaning o'zi ochiladi.
3. Payme/Click to'lovni bizning serverga tasdiqlatadi (Supabase Edge
   funksiyalari `payme` va `click`), va xayriya "tolandi" bo'ladi.
4. Odam sahifaga qaytadi va "Katta rahmat!" xabarini ko'radi.

## 0. Merchant hisobi

Payme Business va Click'da kassa **YaTT yoki MChJ** nomiga ochiladi.
Ariza berishda faoliyat turini va sayt manzilini
(`https://samarali-kun.uz`) ko'rsating.

## 1. Bazaga jadvalni qo'shish

```
supabase db push
```

`supabase/migrations/20261128120000_xayriyalar.sql` qo'llanadi.

## 2. Edge funksiyalarni joylash

```
supabase functions deploy payme
supabase functions deploy click
```

JWT tekshiruvi `supabase/config.toml` da o'chirilgan. Payme va Click
Supabase tokeni yubormaydi: ular kassa kaliti va imzo bilan tekshiriladi.

## 3. Maxfiy kalitlar (faqat serverda)

```
supabase secrets set PAYME_KEY=<kassa kaliti> PAYME_TEST_KEY=<test kaliti>
supabase secrets set CLICK_SERVICE_ID=<xizmat ID> CLICK_SECRET_KEY=<maxfiy kalit>
```

## 4. Kabinetlardagi sozlamalar

**Payme Business → kassa sozlamalari**
- Endpoint URL: `https://<loyiha>.supabase.co/functions/v1/payme`
- Hisob (account) maydoni: **`xayriya_id`** (aynan shu nom)

**Click → xizmat sozlamalari**
- Prepare URL va Complete URL ikkalasiga ham:
  `https://<loyiha>.supabase.co/functions/v1/click`

## 5. Saytdagi ID'lar (Vercel → Environment Variables)

| O'zgaruvchi | Qiymat |
|---|---|
| `NEXT_PUBLIC_PAYME_MERCHANT_ID` | Payme kassa ID'si |
| `NEXT_PUBLIC_PAYME_TEST` | sinov paytida `1`, keyin o'chiring |
| `NEXT_PUBLIC_CLICK_SERVICE_ID` | Click xizmat ID'si |
| `NEXT_PUBLIC_CLICK_MERCHANT_ID` | Click merchant ID'si |

Bular maxfiy emas: ular to'lov havolasida baribir ko'rinadi.
O'zgartirgandan keyin saytni qayta deploy qiling.

## 6. Sinov

- **Payme:** `NEXT_PUBLIC_PAYME_TEST=1` bilan test kassasida to'lang, keyin
  Payme Business'dagi **sandbox** testlaridan (barcha usullar) o'ting.
  Ular o'tmaguncha Payme kassani ishga tushirmaydi.
- **Click:** Click bergan test muhitida bitta to'lov qiling.
- To'lovlarni ko'rish: Supabase → Table Editor → `xayriyalar`.

## Ilova (Android/iOS) ichida

Do'kon qoidalari sababli ilova ichida to'lov bo'limi sukut bo'yicha
yashirin (`lib/qollab.ts`: `ILOVADA_TOLOV_KORSATILSIN`). Saytda esa
ko'rinadi.
