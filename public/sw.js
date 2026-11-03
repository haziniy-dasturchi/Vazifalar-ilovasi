// Samara — minimal servis ishchisi.
//
// Chrome/Android'da "o'rnatish" taklifi (beforeinstallprompt) faqat
// fetch hodisasini ushlaydigan ro'yxatdan o'tgan servis ishchisi
// bo'lgandagina chiqadi. Offline kesh strategiyasi hali kerak emas —
// so'rovlar to'g'ridan-to'g'ri tarmoqqa o'tkaziladi.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
