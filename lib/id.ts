/**
 * Yangi yozuv uchun ID — BRAUZERDA yaratiladi.
 *
 * Nega: avval yangi vazifa `vaqtinchalik-<vaqt>` degan soxta id
 * bilan keshda turardi va haqiqiy id serverdan kelardi. Internet
 * yo'q paytda esa u hech qachon kelmaydi — demak endigina
 * qo'shilgan vazifani tahrirlab ham, o'chirib ham bo'lmasdi
 * ("Vazifa topilmadi" degan xato chiqardi).
 *
 * ID brauzerda yaratilsa, vazifa tug'ilgan zahoti to'laqonli
 * bo'ladi: uni darhol tahrirlash, o'chirish va bajarilgan deb
 * belgilash mumkin, bularning hammasi navbatda to'g'ri tartibda
 * serverga boradi.
 */
export function yangiId(): string {
  const c = globalThis.crypto

  if (typeof c?.randomUUID === 'function') return c.randomUUID()

  // Zaxira yo'l: eski Safari'da `randomUUID` yo'q, lekin
  // `getRandomValues` bor. RFC 4122 v4 qo'lda yig'iladi.
  if (typeof c?.getRandomValues === 'function') {
    const b = c.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = [...b].map((n) => n.toString(16).padStart(2, '0')).join('')
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
  }

  // Bu yergacha yetib kelish deyarli imkonsiz (crypto hamma
  // zamonaviy brauzerda bor), lekin id baribir noyob bo'lishi kerak
  const r = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')
  return `${r()}${r()}-${r()}-4${r().slice(1)}-a${r().slice(1)}-${r()}${r()}${r()}`
}
