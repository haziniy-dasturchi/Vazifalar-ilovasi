'use client'

import { createContext, useContext } from 'react'

export type Foydalanuvchi = {
  id: string
  ism: string
  email: string
  rasm: string | null
}

const FoydalanuvchiContext = createContext<Foydalanuvchi | null>(null)

export function FoydalanuvchiProvider({
  qiymat,
  children,
}: {
  qiymat: Foydalanuvchi
  children: React.ReactNode
}) {
  return (
    <FoydalanuvchiContext.Provider value={qiymat}>
      {children}
    </FoydalanuvchiContext.Provider>
  )
}

export function useFoydalanuvchi() {
  const ctx = useContext(FoydalanuvchiContext)
  if (!ctx) {
    throw new Error('useFoydalanuvchi faqat ilova ichida ishlaydi')
  }
  return ctx
}
