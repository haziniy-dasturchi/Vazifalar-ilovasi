// Samara — offline servis ishchisi.
//
// Maqsad: internet bo'lmasa ham ilova ochilsin va ishlasin.
//   * Ilova qobig'i (sahifalar, JS, CSS, shriftlar) keshdan beriladi
//   * Ma'lumotlar React Query keshida (IndexedDB) saqlanadi — u yerda
//     offline o'qish ta'minlanadi, bu fayl unga aralashmaydi
//   * Supabase API so'rovlari HECH QACHON keshlanmaydi: eski
//     ma'lumotni yangi deb ko'rsatish xatoga olib keladi

const KESH = 'samara-v2'

/** Internet yo'qligida ko'rsatiladigan zaxira sahifa */
const ZAXIRA = '/offline.html'

/**
 * O'rnatish paytida darhol keshlanadigan fayllar.
 *
 * MUHIM: asosiy sahifalar ham shu yerda. Aks holda ilova offline
 * ochilganda (PWA start_url = /jarayonda) o'sha sahifa keshda
 * bo'lmay, zaxira "Internet yo'q" ekrani chiqib qolardi — foydalanuvchi
 * uchun bu ilova umuman ishlamayapti degani.
 */
const ASOSIY = [
  ZAXIRA,
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/jarayonda',
  '/bugun',
  '/kelgusi',
  '/korish',
  '/hisobot',
  '/kechki-reja',
  '/yoriqnoma',
  '/arxiv',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(KESH)
      .then((k) =>
        // Bittasi tushmay qolsa ham o'rnatish buzilmasligi uchun
        // har birini alohida qo'shamiz (addAll "hammasi yoki hech nima")
        Promise.all(
          ASOSIY.map((yol) =>
            fetch(yol, { cache: 'reload' })
              .then((javob) => (javob.ok ? k.put(yol, javob) : null))
              .catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomlar) =>
        Promise.all(nomlar.filter((n) => n !== KESH).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  )
})

/** Supabase va boshqa tashqi API — keshlanmaydi */
function apiSorovmi(url) {
  return (
    url.hostname.endsWith('.supabase.co') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/api/')
  )
}

/** Next.js'ning o'zgarmas (hash'li nomli) fayllari */
function abadiymi(url) {
  return url.pathname.startsWith('/_next/static/')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (apiSorovmi(url)) return

  // 1) Hash'li fayllar hech qachon o'zgarmaydi — avval keshdan
  if (abadiymi(url)) {
    event.respondWith(
      caches.match(request).then(
        (kesh) =>
          kesh ??
          fetch(request).then((javob) => {
            if (javob.ok) {
              const nusxa = javob.clone()
              caches.open(KESH).then((k) => k.put(request, nusxa))
            }
            return javob
          })
      )
    )
    return
  }

  // 2) Sahifalar (navigatsiya): avval tarmoq, bo'lmasa kesh, u ham
  //    bo'lmasa zaxira sahifa. Shunda ma'lumot doim yangi bo'ladi,
  //    lekin internet yo'qolganda ilova baribir ochiladi.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((javob) => {
          if (javob.ok) {
            const nusxa = javob.clone()
            caches.open(KESH).then((k) => k.put(request, nusxa))
          }
          return javob
        })
        .catch(async () => {
          const kesh = await caches.match(request)
          return kesh ?? (await caches.match(ZAXIRA)) ?? Response.error()
        })
    )
    return
  }

  // 3) Qolgan o'z fayllarimiz (rasm, shrift): keshdan, parallel yangilab
  event.respondWith(
    caches.match(request).then((kesh) => {
      const tarmoq = fetch(request)
        .then((javob) => {
          if (javob.ok) {
            const nusxa = javob.clone()
            caches.open(KESH).then((k) => k.put(request, nusxa))
          }
          return javob
        })
        .catch(() => kesh ?? Response.error())
      return kesh ?? tarmoq
    })
  )
})

// =============================================================
// Push bildirishnomalar
// =============================================================
// Server (Supabase Edge Function) vaqti kelgan vazifa haqida
// xabar yuboradi. Ilova yopiq bo'lsa ham shu yerda qabul qilinadi.

self.addEventListener('push', (event) => {
  let malumot = {}
  try {
    malumot = event.data ? event.data.json() : {}
  } catch {
    // Noto'g'ri formatdagi xabar bo'lsa ham bildirishnoma chiqsin
  }

  event.waitUntil(
    self.registration.showNotification(malumot.sarlavha || 'Samara', {
      body: malumot.matn || '',
      icon: '/icons/notification-icon-192.png',
      badge: '/icons/notification-badge-96.png',
      lang: 'uz',
      data: { yol: malumot.yol || '/bugun' },
      // Bir xil vazifa uchun ikkita bildirishnoma to'planib qolmasin
      tag: malumot.yol || 'samara-eslatma',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const yol = (event.notification.data && event.notification.data.yol) || '/bugun'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((oynalar) => {
        // Ilova allaqachon ochiq bo'lsa — o'sha oynani ishlatamiz
        for (const oyna of oynalar) {
          if ('focus' in oyna) {
            if ('navigate' in oyna) oyna.navigate(yol)
            return oyna.focus()
          }
        }
        return self.clients.openWindow(yol)
      })
  )
})
