'use client'

import { QueryClient, onlineManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'
import { useEffect, useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { PwaOrnatish } from '@/components/app/pwa-ornatish'
import { OfflineBelgisi } from '@/components/app/offline-belgisi'
import { BildirishnomaEslatmasi } from '@/components/app/bildirishnoma-eslatmasi'
import { mutatsiyalarniRoyxatdanOtkaz } from '@/lib/queries/mutatsiya-sozlamalari'

/** Kesh IndexedDB'da — localStorage'dan farqli, katta va bloklamaydi */
const SAQLAGICH_KALITI = 'samara-query-cache'

function persisterYarat() {
  return createAsyncStoragePersister({
    storage: {
      getItem: (k) => get(k).then((v) => v ?? null),
      setItem: (k, v) => set(k, v),
      removeItem: (k) => del(k),
    },
    key: SAQLAGICH_KALITI,
    throttleTime: 1000,
  })
}

function mijozYarat() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        // Ma'lumot 30 soniya "yangi" hisoblanadi — ortiqcha so'rov bo'lmaydi
        staleTime: 30_000,
        // Offline ishlashi uchun kesh uzoq saqlanadi (7 kun).
        // gcTime persist muddatidan kam bo'lmasligi kerak, aks holda
        // tiklangan kesh darhol tozalanib ketadi.
        gcTime: 7 * 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        // Aloqa tiklanganda qayta yuborishga imkon beradi
        retry: 2,
        retryDelay: (urinish) => Math.min(1000 * 2 ** urinish, 30_000),
      },
    },
  })

  // Yozuvlarni nomi bo'yicha ro'yxatdan o'tkazamiz — shunda ular
  // saqlanib, ilova qayta ochilgandan keyin ham davom ettiriladi
  mutatsiyalarniRoyxatdanOtkaz(qc)
  return qc
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(mijozYarat)
  const [persister] = useState(persisterYarat)

  // Aloqa tiklanganda to'xtab qolgan yozuvlarni darhol yuboramiz
  useEffect(() => {
    return onlineManager.subscribe((onlayn) => {
      if (onlayn) queryClient.resumePausedMutations()
    })
  }, [queryClient])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          // Faqat muvaffaqiyatli so'rovlar saqlanadi — xato holat
          // keyingi ochilishda "yopishib" qolmasligi uchun
          shouldDehydrateQuery: (q) => q.state.status === 'success',
          // Internet yo'qligi sababli to'xtab qolgan yozuvlar
          // saqlanadi: ilova yopilib qayta ochilsa ham yo'qolmaydi
          shouldDehydrateMutation: (m) => m.state.isPaused,
        },
      }}
      onSuccess={() => {
        // Kesh tiklangach, navbatda turgan yozuvlarni yuborishga
        // urinamiz (onlayn bo'lsa darhol, bo'lmasa — aloqa
        // tiklanganda yuqoridagi obuna ishga tushadi)
        queryClient.resumePausedMutations()
      }}
    >
      <ToastProvider>
        <OfflineBelgisi />
        <PwaOrnatish />
        <BildirishnomaEslatmasi />
        {children}
      </ToastProvider>
    </PersistQueryClientProvider>
  )
}
