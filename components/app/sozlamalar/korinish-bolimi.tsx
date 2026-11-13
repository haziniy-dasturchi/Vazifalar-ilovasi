'use client'

import { MavzuSozlamasi } from '@/components/app/mavzu-sozlamasi'
import { useProfilYangilash } from '@/lib/queries/profil'

export function KorinishBolimi() {
  const yangilash = useProfilYangilash()

  return (
    <div className="space-y-4">
      {/*
        Tanlov ikki joyga yoziladi:
          - localStorage — sahifa chizilishidan oldin o'qiladi, shuning
            uchun qorong'i rejimda oq chaqnash bo'lmaydi;
          - profil — boshqa qurilmada ham o'sha ko'rinish bo'lsin.
        Hisobga yozish xato bersa ham joriy qurilmada mavzu ishlayveradi,
        shuning uchun xato foydalanuvchiga ko'rsatilmaydi.
      */}
      <MavzuSozlamasi
        onOzgarish={(mavzu) => {
          yangilash.mutate({ theme: mavzu })
        }}
      />
    </div>
  )
}
