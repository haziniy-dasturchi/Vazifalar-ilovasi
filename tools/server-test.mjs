// =============================================================
// Serverdagi ilovani tekshirish
// =============================================================
// Faqat ochiq (maxfiy bo'lmagan) qiymatlar bilan ishlaydi:
// Supabase URL, anon kalit va sayt manzili.
//
// Ishga tushirish:
//   node tools/server-test.mjs <SUPABASE_URL> <ANON_KEY> <SAYT_URL>
// yoki muhit o'zgaruvchilari bilan:
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SAYT_URL=... node tools/server-test.mjs

const [, , argUrl, argKey, argSite] = process.argv

const SUPABASE_URL = (argUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
const ANON_KEY = argKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SITE_URL = (argSite ?? process.env.SAYT_URL ?? '').replace(/\/$/, '')

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    'Foydalanish: node tools/server-test.mjs <SUPABASE_URL> <ANON_KEY> [SAYT_URL]'
  )
  process.exit(2)
}

let otdi = 0
const xatolar = []

function ok(nom, shart, izoh = '') {
  if (shart) {
    otdi++
    console.log(`  ok   ${nom}`)
  } else {
    xatolar.push(`${nom}${izoh ? ' — ' + izoh : ''}`)
    console.log(`  XATO ${nom}${izoh ? ' — ' + izoh : ''}`)
  }
}

async function so(url, options = {}) {
  try {
    return await fetch(url, { redirect: 'manual', ...options })
  } catch (e) {
    return { ok: false, status: 0, xato: String(e.message ?? e) }
  }
}

// =============================================================
console.log('\n== 1. Supabase API ==')

const rest = await so(`${SUPABASE_URL}/rest/v1/`, {
  headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
})
ok(
  'REST API javob bermoqda',
  rest.status === 200,
  `status=${rest.status} (401 bo‘lsa anon kalit noto‘g‘ri)`
)

const auth = await so(`${SUPABASE_URL}/auth/v1/settings`, {
  headers: { apikey: ANON_KEY },
})
ok('Auth xizmati javob bermoqda', auth.status === 200, `status=${auth.status}`)

if (auth.status === 200) {
  const sozlama = await auth.json()
  ok(
    'Google provayderi yoqilgan',
    sozlama?.external?.google === true,
    `external=${JSON.stringify(sozlama?.external ?? {})}`
  )
  ok(
    'Email/parol bilan ro‘yxatdan o‘tish yopilgan',
    sozlama?.external?.email === false || sozlama?.disable_signup === true,
    `email=${sozlama?.external?.email}, disable_signup=${sozlama?.disable_signup}`
  )
}

// =============================================================
console.log('\n== 2. Xavfsizlik (RLS) ==')

for (const jadval of ['tasks', 'folders', 'profiles', 'task_events']) {
  const javob = await so(`${SUPABASE_URL}/rest/v1/${jadval}?select=id&limit=5`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  })

  let tana = null
  if (javob.status === 200) {
    try {
      tana = await javob.json()
    } catch {
      tana = null
    }
  }

  // anon uchun grant berilmagan -> 401/403, yoki RLS tufayli bo'sh ro'yxat
  const xavfsiz =
    javob.status === 401 ||
    javob.status === 403 ||
    javob.status === 404 ||
    (javob.status === 200 && Array.isArray(tana) && tana.length === 0)

  ok(
    `anon "${jadval}" jadvalidan ma’lumot ola olmaydi`,
    xavfsiz,
    `status=${javob.status} javob=${JSON.stringify(tana)?.slice(0, 80)}`
  )
}

const rpc = await so(`${SUPABASE_URL}/rest/v1/rpc/get_report`, {
  method: 'POST',
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_from: '2026-01-01', p_to: '2026-01-31' }),
})
ok(
  'anon get_report ni chaqira olmaydi',
  rpc.status !== 200,
  `status=${rpc.status}`
)

// =============================================================
console.log('\n== 3. Google bilan kirish ==')

const redirect = SITE_URL ? `${SITE_URL}/auth/callback` : 'http://localhost:3000/auth/callback'
const authorize = await so(
  `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`,
  { headers: { apikey: ANON_KEY } }
)
const joy = authorize.headers?.get?.('location') ?? ''
ok(
  'Kirish so‘rovi Google sahifasiga yo‘naltiradi',
  authorize.status === 302 && joy.includes('accounts.google.com'),
  `status=${authorize.status} location=${joy.slice(0, 90)}`
)
if (joy.includes('error')) {
  console.log(`       diqqat: ${joy.slice(0, 200)}`)
}

// =============================================================
if (SITE_URL) {
  console.log('\n== 4. Sayt (Vercel) ==')

  const kirish = await so(`${SITE_URL}/kirish`)
  const kirishMatni = kirish.status === 200 ? await kirish.text() : ''
  ok('/kirish ochilmoqda', kirish.status === 200, `status=${kirish.status}`)
  ok(
    '/kirish sahifasida ilova nomi bor',
    kirishMatni.includes('Vazifalar'),
    'sahifada "Vazifalar" topilmadi'
  )
  ok(
    '/kirish sahifasida Google tugmasi bor',
    kirishMatni.includes('Google bilan davom etish'),
    'tugma topilmadi'
  )

  const bugun = await so(`${SITE_URL}/bugun`)
  const bugunJoy = bugun.headers?.get?.('location') ?? ''
  ok(
    'Kirmagan foydalanuvchi /bugun dan /kirish ga yo‘naltiriladi',
    bugun.status === 307 && bugunJoy.includes('/kirish'),
    `status=${bugun.status} location=${bugunJoy}`
  )

  const manifest = await so(`${SITE_URL}/manifest.webmanifest`)
  const manifestTana = manifest.status === 200 ? await manifest.json() : null
  ok(
    'PWA manifesti to‘g‘ri',
    manifestTana?.name === 'Vazifalar' && manifestTana?.theme_color === '#003933',
    `manifest=${JSON.stringify(manifestTana)?.slice(0, 80)}`
  )

  const ikonka = await so(`${SITE_URL}/icon.png`)
  ok(
    'Ikonka beriladi',
    ikonka.status === 200 &&
      (ikonka.headers?.get?.('content-type') ?? '').includes('image/png'),
    `status=${ikonka.status}`
  )

  const yoq = await so(`${SITE_URL}/bunday-sahifa-yoq`)
  ok(
    'Mavjud bo‘lmagan sahifa 404 beradi',
    yoq.status === 404 || yoq.status === 307,
    `status=${yoq.status}`
  )
} else {
  console.log('\n== 4. Sayt ==\n  (SAYT_URL berilmadi — o‘tkazib yuborildi)')
}

// =============================================================
console.log('\n=============================================')
console.log(`  O‘tdi: ${otdi}   Xato: ${xatolar.length}`)
if (xatolar.length) {
  console.log('\n  Xatolar:')
  for (const x of xatolar) console.log('   - ' + x)
}
console.log('=============================================\n')

process.exit(xatolar.length ? 1 : 0)
