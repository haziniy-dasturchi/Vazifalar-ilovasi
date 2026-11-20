import { describe, expect, it } from 'vitest'
import { loyihaHolati, loyihalarniGuruhla } from './loyiha-guruhlari'

describe('loyihaHolati', () => {
  it('vazifasi yo‘q loyiha — rejada', () => {
    expect(loyihaHolati({ jami: 0, bajarilgan: 0 })).toBe('rejada')
  })

  it('hech biri bajarilmagan — rejada', () => {
    expect(loyihaHolati({ jami: 5, bajarilgan: 0 })).toBe('rejada')
  })

  it('hammasi bajarilgan — bajarilgan', () => {
    expect(loyihaHolati({ jami: 5, bajarilgan: 5 })).toBe('bajarilgan')
  })

  it('bir qismi bajarilgan — jarayonda', () => {
    expect(loyihaHolati({ jami: 5, bajarilgan: 2 })).toBe('jarayonda')
  })

  it('yaxlitlanganda 0% chiqadigan loyiha ham jarayonda hisoblanadi', () => {
    // 1/300 = 0.33% -> yaxlitlanganda 0%, lekin ish boshlangan
    expect(loyihaHolati({ jami: 300, bajarilgan: 1 })).toBe('jarayonda')
  })

  it('bittadan bitta bajarilgan — bajarilgan', () => {
    expect(loyihaHolati({ jami: 1, bajarilgan: 1 })).toBe('bajarilgan')
  })
})

describe('loyihalarniGuruhla', () => {
  const loyihalar = [
    { nom: 'A', jami: 4, bajarilgan: 4 },
    { nom: 'B', jami: 4, bajarilgan: 0 },
    { nom: 'C', jami: 4, bajarilgan: 1 },
    { nom: 'D', jami: 0, bajarilgan: 0 },
    { nom: 'E', jami: 10, bajarilgan: 9 },
  ]

  it('uchta guruhga to‘g‘ri taqsimlaydi', () => {
    const g = loyihalarniGuruhla(loyihalar, (l) => l)
    expect(g.jarayonda.map((l) => l.nom)).toEqual(['C', 'E'])
    expect(g.rejada.map((l) => l.nom)).toEqual(['B', 'D'])
    expect(g.bajarilgan.map((l) => l.nom)).toEqual(['A'])
  })

  it('guruh ichidagi tartibni saqlaydi', () => {
    const teskari = [...loyihalar].reverse()
    const g = loyihalarniGuruhla(teskari, (l) => l)
    expect(g.jarayonda.map((l) => l.nom)).toEqual(['E', 'C'])
    expect(g.rejada.map((l) => l.nom)).toEqual(['D', 'B'])
  })

  it('bo‘sh ro‘yxatda uchta bo‘sh guruh qaytaradi', () => {
    const g = loyihalarniGuruhla([], (l: { jami: number; bajarilgan: number }) => l)
    expect(g).toEqual({ jarayonda: [], rejada: [], bajarilgan: [] })
  })

  it('vazifa bajarilgach loyiha boshqa guruhga o‘tadi', () => {
    const avval = loyihalarniGuruhla(
      [{ nom: 'X', jami: 2, bajarilgan: 1 }],
      (l) => l
    )
    expect(avval.jarayonda).toHaveLength(1)

    const keyin = loyihalarniGuruhla(
      [{ nom: 'X', jami: 2, bajarilgan: 2 }],
      (l) => l
    )
    expect(keyin.jarayonda).toHaveLength(0)
    expect(keyin.bajarilgan).toHaveLength(1)
  })
})
