/**
 * "Internet yo'q" oynasining ochiq/yopiqligi — `mavzu.ts` dagi kabi
 * oddiy obuna tizimi. React holatidan tashqarida saqlanadi, chunki
 * uni ochadigan joy (`useOutboxMutation`, bir hook ichida emas, lib/
 * darajasida) komponent daraxtidan mustaqil bo'lishi kerak.
 */

let ochiqmi = false
const tinglovchilar = new Set<() => void>()

export function offlineOynasiOchiqmi() {
  return ochiqmi
}

export function offlineOynasigaObuna(fn: () => void) {
  tinglovchilar.add(fn)
  return () => {
    tinglovchilar.delete(fn)
  }
}

export function offlineOynasiniOch() {
  if (ochiqmi) return
  ochiqmi = true
  tinglovchilar.forEach((fn) => fn())
}

export function offlineOynasiniYop() {
  if (!ochiqmi) return
  ochiqmi = false
  tinglovchilar.forEach((fn) => fn())
}
