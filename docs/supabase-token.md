# Supabase tokenini yangilash — qadamma-qadam

Token — bu parol emas. Bu «vaqtinchalik kalit»: men u bilan faqat
ma'lumotlar bazasiga o'zgarish kirita olaman. Hisobingizga kira
olmayman, parolingizni ko'rmayman.

Token kerak, chunki **hisobni o'chirish** funksiyasini bazaga qo'yishim
kerak. Google Play busiz arizani qabul qilmaydi.

---

## 1-qadam — Sahifani oching

Brauzerda shu manzilni oching:

```
https://supabase.com/dashboard/account/tokens
```

Agar kirish so'ralsa, odatdagidek kiring (`xoldarovazizbek80@gmail.com`).

---

## 2-qadam — Yangi token yarating

1. O'ng yuqorida **«Generate new token»** degan yashil tugma bor —
   shuni bosing
2. Nom so'raydi. Yozing: `samara-claude`
3. **«Generate token»** ni bosing

---

## 3-qadam — Tokenni nusxalang

Ekranda uzun matn paydo bo'ladi. U `sbp_` bilan boshlanadi, masalan:

```
sbp_a1b2c3d4e5f6...
```

Yonidagi **nusxalash** belgisini bosing.

> ⚠️ **Diqqat:** bu matn **faqat bir marta** ko'rsatiladi. Sahifani
> yopsangiz, boshqa ko'ra olmaysiz. Shuning uchun darhol 4-qadamga
> o'ting.

---

## 4-qadam — Faylga joylashtiring

1. Kompyuterda shu papkani oching:

   ```
   C:\Users\user\Desktop\Vazifalar ilovasi\.secrets
   ```

   > Papka ko'rinmasa: Explorer'da yuqoridagi **View** → **Show** →
   > **Hidden items** ni belgilang.

2. Ichidagi **`supabase-token.txt`** faylini **Notepad** bilan oching
3. Ichidagi **eski matnni butunlay o'chiring**
4. Nusxalangan yangi tokenni joylashtiring (Ctrl+V)
5. **Ctrl+S** bilan saqlang va Notepad'ni yoping

> Faylda faqat token bo'lsin — boshqa hech narsa, bo'sh qator ham
> qolmasin.

---

## 5-qadam — Menga ayting

Menga shunchaki yozing: **«token tayyor»**

Qolganini men qilaman:
- hisobni o'chirish funksiyasini bazaga qo'yaman
- sinab ko'raman (haqiqiy ma'lumotlaringizga tegmasdan, sinov hisobi
  bilan)
- ilovaga tugmani ulayman va jonli serverga chiqaraman

---

## Xavfsizlik haqida

- `.secrets` papkasi GitHub'ga **yuklanmaydi** — u maxsus ro'yxatda
  (`.gitignore`) turadi
- Token kerak bo'lmay qolsa, o'sha sahifadan o'chirib tashlashingiz
  mumkin (**Revoke**)
- Tokenni hech kimga yubormang va skrinshotga tushirmang
