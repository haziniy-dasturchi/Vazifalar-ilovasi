import { describe, expect, it } from 'vitest'
import { kechikkanmi, xodimlarHisoboti } from './topshiriq-yordam'
import type { Topshiriq } from '@/types/vazifalar'

function t(qism: Partial<Topshiriq>): Topshiriq {
  return {
    id: Math.random().toString(),
    yuboruvchi_id: 'a',
    qabul_qiluvchi_email: 'x@u.uz',
    sarlavha: 's',
    izoh: null,
    muddat: null,
    muhimlik: 4,
    holat: 'qabul',
    rad_sababi: null,
    vazifa_id: null,
    bildirildi_at: null,
    created_at: '2026-11-20T08:00:00Z',
    javob_at: null,
    ...qism,
  }
}

describe('kechikkanmi', () => {
  const bugun = '2026-11-25'
  it("muddati o'tgan ochiq topshiriq kechikkan", () => {
    expect(kechikkanmi(t({ muddat: '2026-11-24' }), bugun)).toBe(true)
  })
  it('bajarilgan yoki tekshiruvdagi kechikkan emas', () => {
    expect(kechikkanmi(t({ muddat: '2026-11-24', holat: 'bajarildi' }), bugun)).toBe(false)
    expect(kechikkanmi(t({ muddat: '2026-11-24', holat: 'tekshiruvda' }), bugun)).toBe(false)
  })
  it('bugungi muddat soatga qarab', () => {
    const tush = new Date('2026-11-25T12:00:00')
    expect(kechikkanmi(t({ muddat: bugun, muddat_vaqt: '09:00:00' }), bugun, tush)).toBe(true)
    expect(kechikkanmi(t({ muddat: bugun, muddat_vaqt: '18:00:00' }), bugun, tush)).toBe(false)
    expect(kechikkanmi(t({ muddat: bugun }), bugun, tush)).toBe(false)
  })
})

describe('xodimlarHisoboti', () => {
  it('ijrochi kesimida sanaydi va kechikkanni tepaga chiqaradi', () => {
    const r = xodimlarHisoboti(
      [
        t({ qabul_qiluvchi_email: 'a@u.uz', holat: 'bajarildi', muddat: '2026-11-22',
            topshirilgan_at: '2026-11-21T08:00:00Z', baho: 4 }),
        t({ qabul_qiluvchi_email: 'a@u.uz', holat: 'bajarildi', muddat: '2026-11-21',
            topshirilgan_at: '2026-11-23T08:00:00Z', baho: 5 }),
        t({ qabul_qiluvchi_email: 'b@u.uz', muddat: '2026-11-01' }),
      ],
      '2026-11-25'
    )
    expect(r[0].email).toBe('b@u.uz')
    expect(r[0].kechikkan).toBe(1)
    const a = r.find((x) => x.email === 'a@u.uz')!
    expect(a.bajarilgan).toBe(2)
    expect(a.muddatida).toBe(50)
    expect(a.ortachaBaho).toBe(4.5)
    expect(a.ortachaSoat).toBe(48) // (24 + 72) / 2
  })
})
