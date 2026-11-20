import { describe, expect, it } from 'vitest'
import {
  qismanBajarilganlar,
  qismanXulosa,
  type JurnalQatori,
} from './hisobot-filtr'

/** Qisqa yozuv uchun yordamchi */
function qator(q: Partial<JurnalQatori> & { task_id: string }): JurnalQatori {
  return {
    sarlavha: 'Vazifa',
    oldingi: 0,
    yangi: 50,
    joriyFoiz: 50,
    bajarilganmi: false,
    ...q,
  }
}

describe('qismanBajarilganlar', () => {
  it('yarim yo‘ldagi vazifani qoldiradi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 40, joriyFoiz: 40 }),
    ])
    expect(natija).toHaveLength(1)
    expect(natija[0]).toMatchObject({ task_id: 'a', osish: 40, joriyFoiz: 40 })
  })

  it('100% bo‘lgan vazifani chiqarib tashlaydi (ikki marta sanalmasin)', () => {
    const natija = qismanBajarilganlar([
      qator({
        task_id: 'a',
        oldingi: 0,
        yangi: 100,
        joriyFoiz: 100,
        bajarilganmi: true,
      }),
    ])
    expect(natija).toHaveLength(0)
  })

  it('foizi 100 bo‘lsa, holat "done" bo‘lmasa ham chiqarib tashlaydi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 50, yangi: 100, joriyFoiz: 100 }),
    ])
    expect(natija).toHaveLength(0)
  })

  it('0% ga qaytarilgan vazifani qoldirmaydi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 60, joriyFoiz: 0 }),
      qator({ task_id: 'a', oldingi: 60, yangi: 0, joriyFoiz: 0 }),
    ])
    expect(natija).toHaveLength(0)
  })

  it('bitta vazifaning bir necha o‘zgarishini qo‘shib yuboradi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 20, joriyFoiz: 60 }),
      qator({ task_id: 'a', oldingi: 20, yangi: 40, joriyFoiz: 60 }),
      qator({ task_id: 'a', oldingi: 40, yangi: 60, joriyFoiz: 60 }),
    ])
    expect(natija).toHaveLength(1)
    expect(natija[0].osish).toBe(60)
  })

  it('sof o‘sish manfiy yoki nol bo‘lsa qoldirmaydi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 60, yangi: 80, joriyFoiz: 30 }),
      qator({ task_id: 'a', oldingi: 80, yangi: 30, joriyFoiz: 30 }),
    ])
    // +20 va -50 = -30
    expect(natija).toHaveLength(0)
  })

  it('takrorlanuvchi vazifa (0→100→0) ro‘yxatga tushmaydi', () => {
    // complete_task takrorlanuvchi vazifani qayta "planned" qiladi,
    // shunda foiz 100 dan 0 ga qaytadi — sof o'sish nolga teng
    const natija = qismanBajarilganlar([
      qator({ task_id: 'r', oldingi: 0, yangi: 100, joriyFoiz: 0 }),
      qator({ task_id: 'r', oldingi: 100, yangi: 0, joriyFoiz: 0 }),
    ])
    expect(natija).toHaveLength(0)
  })

  it('bir nechta vazifani o‘sish bo‘yicha kamayish tartibida beradi', () => {
    const natija = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 20, joriyFoiz: 20 }),
      qator({ task_id: 'b', oldingi: 0, yangi: 70, joriyFoiz: 70 }),
      qator({ task_id: 'c', oldingi: 0, yangi: 50, joriyFoiz: 50 }),
    ])
    expect(natija.map((y) => y.task_id)).toEqual(['b', 'c', 'a'])
  })

  it('bo‘sh jurnalda bo‘sh ro‘yxat qaytaradi', () => {
    expect(qismanBajarilganlar([])).toEqual([])
  })
})

describe('qismanXulosa', () => {
  it('soni va o‘rtacha foizni hisoblaydi', () => {
    const royxat = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 20, joriyFoiz: 20 }),
      qator({ task_id: 'b', oldingi: 0, yangi: 70, joriyFoiz: 70 }),
    ])
    expect(qismanXulosa(royxat)).toEqual({ soni: 2, ortacha: 45 })
  })

  it('o‘rtachani butun songa yaxlitlaydi', () => {
    const royxat = qismanBajarilganlar([
      qator({ task_id: 'a', oldingi: 0, yangi: 10, joriyFoiz: 10 }),
      qator({ task_id: 'b', oldingi: 0, yangi: 20, joriyFoiz: 20 }),
      qator({ task_id: 'c', oldingi: 0, yangi: 30, joriyFoiz: 30 }),
      qator({ task_id: 'd', oldingi: 0, yangi: 50, joriyFoiz: 50 }),
    ])
    // (10+20+30+50)/4 = 27.5 -> 28
    expect(qismanXulosa(royxat).ortacha).toBe(28)
  })

  it('bo‘sh ro‘yxatda nol qaytaradi', () => {
    expect(qismanXulosa([])).toEqual({ soni: 0, ortacha: 0 })
  })
})
