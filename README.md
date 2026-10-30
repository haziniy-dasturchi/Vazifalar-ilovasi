# Vazifalar — backend

O'zbek tilidagi, hamma uchun bepul vazifa boshqaruv ilovasining **backend** qismi:
PostgreSQL sxemasi, Row Level Security, triggerlar, RPC funksiyalar va testlar.
Sahifalar va dizayn keyingi bosqichda.

> **To'lov tizimi yo'q.** Barcha imkoniyatlar har bir foydalanuvchi uchun ochiq.

---

## 1. Loyiha tuzilmasi

```
Vazifalar ilovasi/
├─ supabase/
│  ├─ config.toml                    Lokal muhit + Google OAuth sozlamalari
│  ├─ migrations/                    11 ta SQL migratsiya (tartib muhim)
│  │  ├─ ...090000_init_helpers.sql      updated_at, local_date
│  │  ├─ ...090100_profiles.sql          profiles + user_timezone()
│  │  ├─ ...090200_folders_sections.sql  folders, sections
│  │  ├─ ...090300_tasks.sql             tasks (subtask, takrorlanish)
│  │  ├─ ...090400_labels.sql            labels, task_labels
│  │  ├─ ...090500_pomodoro_events.sql   pomodoro_sessions, task_events
│  │  ├─ ...090600_indexes.sql           indekslar
│  │  ├─ ...090700_rls.sql               RLS siyosatlari
│  │  ├─ ...090800_triggers.sql          avtomatika
│  │  ├─ ...090900_rpc_tasks.sql         start/move_back/complete/uncomplete
│  │  └─ ...091000_rpc_report.sql        get_report, folder_health
│  ├─ seed.sql                       Test foydalanuvchi: 3 papka, 20 vazifa
│  └─ tests/                         pgTAP testlari (4 fayl, 75 tasdiq)
├─ types/
│  ├─ database.ts                    `supabase gen types` natijasi
│  └─ vazifalar.ts                   Qo'lda yozilgan yordamchi tiplar
├─ tools/                            Dockersiz lokal tekshiruv (PGlite)
├─ .env.example
└─ README.md
```

---

## 2. Lokal ishga tushirish

**Talablar:** Docker Desktop (ishga tushirilgan holda) va Node.js 18+.
Supabase CLI ni global o'rnatish shart emas — `npx` orqali ishlatish mumkin.
Baza **PostgreSQL 15+** bo'lishi kerak (`on delete set null (ustun)` sintaksisi
shu versiyadan boshlab bor). `supabase/config.toml` da `major_version = 15`.

```bash
cd "Vazifalar ilovasi"
npx supabase start
```

Birinchi ishga tushirishda Docker image'lar yuklanadi (bir necha daqiqa).
Tayyor bo'lgach `npx supabase status` API URL va kalitlarni ko'rsatadi.

Bazani migratsiyalar + seed bilan noldan tiklash:

```bash
npx supabase db reset
```

To'xtatish:

```bash
npx supabase stop
```

---

## 3. Supabase cloud loyihasini ochish

1. https://supabase.com/dashboard → **New project**.
   Region: `Central EU (Frankfurt)` yoki foydalanuvchilarga eng yaqini.
2. Loyiha tayyor bo'lgach **Project Settings → General** dan `Reference ID` ni oling.
3. Lokal papkani loyihaga bog'lang va migratsiyalarni yuklang:

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

4. **Project Settings → API** dan `Project URL` va `anon public` kalitini olib
   `.env.local` ga yozing (namuna: `.env.example`).

> `seed.sql` faqat lokal `db reset` uchun. Jonli bazaga test ma'lumot yuklamang.

---

## 4. Google OAuth sozlash

### 4.1 Google Cloud Console

1. https://console.cloud.google.com → yangi loyiha yarating (masalan `Vazifalar`).
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: `Vazifalar`, support email va developer email — o'z emailingiz
   - Scopes: `userinfo.email`, `userinfo.profile`, `openid` (standart)
   - Test bosqichida o'z akkauntingizni **Test users** ga qo'shing
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Vazifalar web`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://<sizning-domeningiz>
     ```
   - **Authorized redirect URIs** — bu yerda Supabase'ning callback manzili bo'ladi:
     ```
     https://<PROJECT_REF>.supabase.co/auth/v1/callback
     http://127.0.0.1:54321/auth/v1/callback
     ```
     (ikkinchisi lokal `supabase start` uchun)
4. `Client ID` va `Client secret` ni nusxalab oling.

### 4.2 Supabase (cloud)

**Authentication → Providers → Google**: yoqing, `Client ID` va `Client Secret` ni
qo'ying, saqlang. So'ng **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (ishlab chiqish) yoki jonli domen
- Redirect URLs: `http://localhost:3000/auth/callback`, `https://<domen>/auth/callback`

**Authentication → Providers → Email** ni **o'chirib qo'ying** — ilovada faqat
Google orqali kirish bor.

### 4.3 Supabase (lokal)

`supabase/config.toml` da Google provider yoqilgan va kalitlarni muhit
o'zgaruvchilaridan oladi. `supabase start` dan oldin:

```bash
export SUPABASE_AUTH_GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
export SUPABASE_AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"
```

PowerShell'da:

```powershell
$env:SUPABASE_AUTH_GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
$env:SUPABASE_AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"
```

Lokal ishlab chiqishda Google orqali kirishni sinab ko'rmasa ham bo'ladi —
`seed.sql` test foydalanuvchini to'g'ridan-to'g'ri yaratadi.

---

## 5. Ma'lumotlar modeli

| Jadval | Mazmuni |
|---|---|
| `profiles` | Foydalanuvchi sozlamalari (mintaqa, kunlik maqsad, pomodoro, tema) |
| `folders` | Papkalar. Har bir foydalanuvchida aynan bitta `is_inbox` papka |
| `sections` | Papka ichidagi bo'limlar |
| `tasks` | Vazifalar. `parent_id` to'lgan qator — subtask (faqat 1 daraja) |
| `labels`, `task_labels` | Teglar (ko'pga-ko'p) |
| `pomodoro_sessions` | Fokus va tanaffus sessiyalari |
| `task_events` | Hisobotlar uchun hodisalar jurnali |

**Xavfsizlik:** 8 jadvalning hammasida RLS yoqilgan, har birida 4 ta siyosat
(`select/insert/update/delete`) — `user_id = auth.uid()`. `anon` roli uchun
hech qanday siyosat va grant berilmagan, shuning uchun u jadvallarga
umuman kira olmaydi.

**Ustunlar orasidagi DB darajasidagi kafolatlar** (kompozit tashqi kalitlar):

- bo'lim va vazifa doim o'z egasining papkasida bo'ladi;
- vazifa bo'limi doim o'z papkasiga tegishli;
- teg va vazifa bir egaga tegishli bo'lmasa bog'lanmaydi.

### Avtomatika (triggerlar)

| Trigger | Vazifasi |
|---|---|
| `on_auth_user_created` | Yangi foydalanuvchiga profil + bitta `Kiruvchi` papka |
| `folders_protect_inbox_*` | Inbox'ni o'chirish, arxivlash, `is_inbox` ni o'zgartirish taqiqlangan |
| `tasks_hierarchy` | Subtask faqat 1 daraja; subtask ota-vazifa papkasi/bo'limiga tushadi |
| `tasks_sync_children` | Ota-vazifa ko'chirilsa subtasklar ham ko'chadi |
| `tasks_touch_timestamps` | `started_at` / `completed_at` avtomatik to'ldiriladi |
| `tasks_log_event` | `task_events` ga `created/started/moved_back/completed/uncompleted` |
| `tasks_set_updated_at`, `folders_set_updated_at` | `updated_at` |
| `profiles_validate_timezone` | `timezone` haqiqiy IANA nomi bo'lishini tekshiradi |

Cascade: foydalanuvchi → papka → (bo'lim, vazifa) → subtask. Bo'lim o'chsa
undagi vazifalar o'chadi. `task_events` va `pomodoro_sessions` esa saqlanadi —
faqat bog'lanish `null` bo'ladi, shunda hisobot tarixi yo'qolmaydi.

---

## 6. RPC funksiyalar

```ts
// planned -> in_progress  (bir vaqtda bir nechta vazifa in_progress bo'lishi mumkin)
const { data } = await supabase.rpc('start_task', { task_id })

// in_progress -> planned
await supabase.rpc('move_back', { task_id })

// -> done. Takrorlanuvchi vazifa 'planned' ga qaytib, keyingi sanaga suriladi.
await supabase.rpc('complete_task', { task_id, include_subtasks: true })

// done -> planned
await supabase.rpc('uncomplete_task', { task_id })

// Hisobot
const { data: report } = await supabase.rpc('get_report', {
  p_from: '2026-10-17',
  p_to: '2026-10-30',
})
```

`get_report` natijasi (`types/vazifalar.ts` da `ReportResult`):

```json
{
  "summary": {
    "completed": 12,
    "completed_prev": 8,
    "focus_minutes": 125,
    "on_time_rate": 83.3,
    "overdue_open": 4
  },
  "by_day": [{ "date": "2026-10-17", "completed": 0 }],
  "by_folder": [{
    "folder_id": "…", "name": "O'qish", "color": "#f59e0b",
    "completed": 0, "open": 6, "overdue": 4, "focus_minutes": 0,
    "last_activity_at": "2026-10-05T07:00:00+00:00",
    "health": "behind",
    "reason": "Bu davrda 0 ta vazifa bajarilmagan"
  }]
}
```

### `health` qoidalari (birinchi mos kelgani)

1. **behind** — ochiq vazifa bor, lekin davrda 0 ta bajarilgan;
   **yoki** ochiq vazifalarning 30% dan ko'pi kechikkan.
2. **attention** — oxirgi 7 kunda hech qanday hodisa yo'q;
   **yoki** kechikkanlar 10–30% orasida.
3. **good** — qolgan hollar.

---

## 7. Qabul qilingan kelishuvlar

Talablarda aniq ko'rsatilmagan, lekin qaror talab qilgan joylar:

| Mavzu | Qaror |
|---|---|
| `deadline` tipi | `date` (Todoist'dagidek "shu kungacha"), `timestamptz` emas |
| "Belgilangan kun" | `least(due_date, deadline)` — ikkisidan qaysi biri oldin kelsa |
| "Kechikkan" | Ochiq vazifa, belgilangan kuni bugundan oldin (foydalanuvchi mintaqasida) |
| `completed` hisobi | `task_events` dagi `'completed'` hodisalari soni — takrorlanuvchi vazifalar ham sanaladi |
| `on_time_rate` | Davrda `done` bo'lgan vazifalar bo'yicha: bajarilgan kun ≤ belgilangan kun |
| `focus_minutes` | Faqat `completed = true` fokus sessiyalari, haqiqiy davomiylik (`ended_at - started_at`) |
| Takrorlanish bazasi | Eski `due_date` dan qadam tashlanadi va bugundan keyinga o'tguncha davom etadi |
| `weekdays` | Dushanba–Juma (ISO 1–5). `profiles.days_off` bunga ta'sir qilmaydi — u UI/streak uchun |
| `monthly` | Oyning kuni saqlanadi; qisqa oyda oxirgi kunga tushadi (31-yanvar → 28-fevral → 31-mart) |
| `deadline` surilishi | Takrorlanuvchi vazifada `deadline` ham `due_date` bilan bir xil miqdorda suriladi |
| Takrorlanish va subtasklar | Vazifa keyingi sanaga surilganda subtasklari ham `planned` ga qaytadi |
| Subtask bo'limi | Subtask ota-vazifaning papkasi **va** bo'limini oladi |
| `move_back` va `started_at` | `started_at` tozalanmaydi — vazifa qachon birinchi boshlangani tarixda qoladi |
| Papka yaratilishi = harakat | Yangi papka darhol `attention` bo'lib qolmasligi uchun `created_at` ham harakat deb hisoblanadi |
| Arxivlangan papkalar | `get_report` natijasiga kirmaydi |
| Statuslar tipi | `TEXT` + `CHECK` (Postgres `ENUM` emas) — yangi qiymat qo'shish oson |
| `days_off` | `0 = yakshanba … 6 = shanba` |

---

## 8. Testlar

### 8.1 pgTAP (Docker talab qiladi)

```bash
npx supabase test db
```

| Fayl | Nimani tekshiradi |
|---|---|
| `01_rls_test.sql` | RLS: boshqa foydalanuvchining ma'lumotlari ko'rinmaydi, begona `user_id` bilan yozish taqiqlangan, `anon` hech narsaga kira olmaydi |
| `02_inbox_test.sql` | Yangi foydalanuvchida aynan 1 papka; Inbox o'chmaydi/arxivlanmaydi; akkauntni o'chirish esa ishlaydi |
| `03_tasks_test.sql` | RPC funksiyalar, hodisalar, `include_subtasks`, takrorlanish, `next_occurrence`, cascade |
| `04_report_test.sql` | `get_report` ning aniq qiymatlari va `health` ning uchta holati |

### 8.2 Dockersiz tekshiruv (PGlite)

Docker bo'lmasa ham butun sxemani sinab ko'rish mumkin — migratsiyalar
WASM PostgreSQL 17 ichida ishga tushiriladi:

```bash
cd tools
npm install
npm run verify:all
```

- `npm run verify` — migratsiyalar, seed, RLS, triggerlar, RPC, `get_report` (120 tasdiq)
- `npm run verify:tests` — `supabase/tests/*.sql` fayllarini pgTAP shim bilan ishga tushiradi

Bu pgTAP ning o'rnini bosmaydi (haqiqiy `auth` sxemasi va GoTrue yo'q), lekin
SQL mantiqdagi xatolarni Dockersiz ushlaydi.

---

## 9. Tiplar

```bash
# Lokal bazadan
npx supabase gen types typescript --local > types/database.ts

# Yoki cloud loyihadan
npx supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
```

`types/vazifalar.ts` qo'lda yoziladi va qayta generatsiyada o'chmaydi:
`TaskStatus`, `Recurrence`, `FolderHealth`, `ReportResult` va boshqalar.

---

## 10. Frontend

Next.js (App Router) + TypeScript + Tailwind CSS shu papkaning ildizida.

```bash
npm install
npm run dev     # http://localhost:3000
```

`.env.local` faylini `.env.example` dan nusxalab to'ldiring. Lokal Supabase
uchun qiymatlarni `npx supabase status` ko'rsatadi.

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Ishlab chiqarish uchun yig'ish |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run icons` | Logodan favicon va PWA ikonkalarini qayta yasash |

### Brend ranglari

`Logo/PNG/` dagi fayllardan olingan (`app/globals.css` dagi `@theme` bloki):

| Token | HEX | Qayerdan |
|---|---|---|
| `brand-primary` | `#003933` | Logo belgisi va yozuvi |
| `brand-accent` | `#00BC55` | Belgi markazidagi romb |
| `brand-ink` | `#1D1D1B` | Quyi yozuv |
| `brand-soft` | `#E8F3EF` | `brand-primary` ning ochiq tusi (hosil qilingan) |

Holat ranglari brenddan mustaqil: jarayonda `#FEF3C7` / `#F59E0B`,
muhimlik `#DC2626` `#EA580C` `#2563EB` `#9CA3AF`.

### Papkalar tuzilishi

```
app/
├─ (ilova)/          Kirgan foydalanuvchi uchun sahifalar
│  ├─ bugun/ kelgusi/ jarayonda/ korish/ arxiv/ papka/[id]/
│  └─ layout.tsx     Sessiya tekshiruvi + ilova karkasi
├─ auth/callback/    Google'dan qaytish
├─ kirish/           Kirish sahifasi
├─ globals.css       Dizayn tokenlari
└─ manifest.ts       PWA manifesti
components/          UI qismlari (ui/, app/, vazifa/, papka/, sahifalar/)
lib/
├─ queries/          React Query so'rovlari va optimistik yangilash
├─ supabase/         Brauzer, server va middleware mijozlari
└─ sana.ts           O'zbekcha sana yordamchilari
scripts/brand-icons.mjs   Logodan ikonkalar
```
