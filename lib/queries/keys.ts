/** React Query kalitlari — bir joyda turgani invalidatsiyani soddalashtiradi */
export const kalit = {
  /** Sessiyadan olinadigan foydalanuvchi (ism, email, Google avatari) */
  profil: ['profil'] as const,
  /** `profiles` jadvalidagi sozlamalar qatori */
  sozlamalar: ['profil', 'sozlamalar'] as const,
  papkalar: ['papkalar'] as const,
  /** Barcha bo'lim so'rovlari shu prefiks bilan boshlanadi */
  bolimlarPrefiks: ['bolimlar'] as const,
  bolimlar: (papkaId: string) => ['bolimlar', 'papka', papkaId] as const,
  /** Barcha papkalardagi bo'limlar — vazifa qatorida loyihani ko'rsatish uchun */
  barchaBolimlar: ['bolimlar', 'barchasi'] as const,
  /** Barcha vazifa ro'yxatlari shu prefiks bilan boshlanadi */
  vazifalar: ['vazifalar'] as const,
  papkaVazifalari: (papkaId: string) => ['vazifalar', 'papka', papkaId] as const,
  bugungi: () => ['vazifalar', 'bugun'] as const,
  jarayondagi: () => ['vazifalar', 'jarayonda'] as const,
  kelgusi: () => ['vazifalar', 'kelgusi'] as const,
  ertangi: () => ['vazifalar', 'ertangi'] as const,
  /** Barcha topshiriq so'rovlari shu prefiks bilan boshlanadi */
  topshiriqlarPrefiks: ['topshiriqlar'] as const,
  kelganTopshiriqlar: () => ['topshiriqlar', 'kelgan'] as const,
  yuborilganTopshiriqlar: () => ['topshiriqlar', 'yuborilgan'] as const,
  /** Karta uchun: qarshi tomon ismi va ish jarayoni */
  topshiriqTafsilotlari: () => ['topshiriqlar', 'tafsilotlar'] as const,
  /** Kim menga yoza oladi: ruxsat va bloklar */
  topshiriqRuxsatlari: () => ['topshiriqlar', 'ruxsatlar'] as const,
  hisobot: (boshlanish: string, tugash: string) =>
    ['vazifalar', 'hisobot', boshlanish, tugash] as const,
  foizJurnali: (boshlanish: string, tugash: string) =>
    ['vazifalar', 'foiz-jurnali', boshlanish, tugash] as const,
}
