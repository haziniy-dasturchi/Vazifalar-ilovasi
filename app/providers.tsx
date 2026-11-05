'use client'

import { QueryClient, onlineManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { PwaOrnatish } from '@/components/app/pwa-ornatish'
import { OfflineBelgisi } from '@/components/app/offline-belgisi'

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

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Ma'lumot 30 soniya "yangi" hisoblanadi — ortiqcha so'rov bo'lmaydi
            staleTime: 30_000,
            // Offline ishlashi uchun kesh uzoq saqlanadi (7 kun).
            // gcTime persist qilish muddatidan kam bo'lmasligi kerak,
            // aks holda tiklangan kesh darhol tozalanib ketadi.
            gcTime: 7 * 24 * 60 * 60 * 1000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  const [persister] = useState(persisterYarat)

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Faqat muvaffaqiyatli so'rovlar saqlanadi — xato holat
        // keyingi ochilishda "yopishib" qolmasligi uchun
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => q.state.status === 'success',
          // Kutib turgan yozuvlar ataylab saqlanmaydi: ularni ilova
          // qayta ochilgandan keyin davom ettirish uchun har bir
          // mutatsiyaning funksiyasi nom bo'yicha qayta ulanishi
          // kerak. Hozircha ular faqat shu sessiya ichida — aloqa
          // tiklanishi bilan — yuboriladi.
          shouldDehydrateMutation: () => false,
        },
      }}
      onSuccess={() => {
        // Kesh tiklangach, offline paytda to'xtab qolgan yozuvlarni
        // (masalan qo'shilgan vazifa) serverga yuborishga urinamiz
        if (onlineManager.isOnline()) {
          queryClient.resumePausedMutations()
        }
      }}
    >
      <ToastProvider>
        <OfflineBelgisi />
        <PwaOrnatish />
        {children}
      </ToastProvider>
    </PersistQueryClientProvider>
  )
}
