'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { onlineManager } from '@tanstack/react-query'
import { ilovaNativemi } from '@/lib/platform'
import { amaldagiMavzu, mavzugaObuna, mavzuniOqi } from '@/lib/mavzu'
import { faylYoliniTozala, oxirgiYolniSaqla } from './native-darvoza'
import { orqagaQatlamniYop } from '@/lib/orqaga'

/**
 * Faqat Capacitor ichida ishlaydigan narsalar: holat paneli rangi,
 * Android'ning apparat "orqaga" tugmasi va internet holatini aniq
 * kuzatish. Veb'da `ilovaNativemi()` darhol `false` qaytaradi, shuning
 * uchun bu komponent hech narsa qilmaydi — plaginlar ham veb
 * bundle'ida chaqirilmaydi.
 *
 * Internet holati UCHUN ATAYLAB `navigator.onLine` ishlatilmaydi:
 * Android WebView'da bu qiymat Wi-Fi/mobil internet o'chirilgandan
 * keyin ham bir muddat "onlayn" bo'lib qolishi mumkin (brauzerning o'zi
 * emas, operatsion tizim darajasidagi xatti-harakat). `@capacitor/network`
 * esa Android'ning `ConnectivityManager`'idan to'g'ridan-to'g'ri
 * so'raydi — aniqroq.
 */
export function NativeBootstrap() {
  const router = useRouter()

  useEffect(() => {
    if (!ilovaNativemi()) return

    let tozalash = () => {}

    // Dinamik import: bu plaginlar faqat native platformada haqiqiy
    // ishlaydi, veb bundle'iga ortiqcha kod qo'shmaslik uchun shu yerda
    Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/app'),
      import('@capacitor/network'),
      import('@capacitor/push-notifications'),
    ]).then(([{ StatusBar, Style }, { App }, { Network }, { PushNotifications }]) => {
      function holatPanelini(mavzu: 'light' | 'dark') {
        StatusBar.setStyle({
          style: mavzu === 'dark' ? Style.Dark : Style.Light,
        }).catch(() => {
          // Ba'zi Android versiyalarida (edge-to-edge majburiy) bu
          // chaqiruv rad etilishi mumkin — jiddiy emas, shunchaki o'tkazib
          // yuboramiz
        })
      }
      holatPanelini(amaldagiMavzu(mavzuniOqi()))
      const obunaYechish = mavzugaObuna(() =>
        holatPanelini(amaldagiMavzu(mavzuniOqi()))
      )

      // Apparat "orqaga" tugmasi: ichkarida bo'lsa Next'ning o'z
      // tarixiga qaytaramiz, ro'yxat tepasida bo'lsa ilovadan chiqamiz —
      // aks holda tugma hech narsa qilmay ilova "osilib qolgandek"
      // ko'rinadi
      const tinglovchiVadasi = App.addListener('backButton', ({ canGoBack }) => {
        // Avval ochiq oyna/menyu yopiladi (lib/orqaga.ts)
        if (orqagaQatlamniYop()) return
        if (canGoBack) router.back()
        else App.exitApp()
      })

      // TanStack Query'ning "onlayn/offlayn" signalini brauzer
      // hodisalari o'rniga shu yerdan oladi
      onlineManager.setEventListener((setOnline) => {
        Network.getStatus().then((holat) => setOnline(holat.connected))
        const vada = Network.addListener('networkStatusChange', (holat) =>
          setOnline(holat.connected)
        )
        return () => {
          vada.then((t) => t.remove())
        }
      })

      // Eslatmalar uchun yuqori muhimlikdagi kanal (ekran tepasida
      // chiqadi, ovoz bilan). Nomi AndroidManifest'dagi
      // `default_notification_channel_id` bilan bir xil. Kanal bir marta
      // yaratiladi, keyingi chaqiruvlar uni o'zgartirmaydi.
      PushNotifications.createChannel({
        id: 'eslatmalar',
        name: 'Vazifa eslatmalari',
        description: 'Vaqti kelgan vazifalar va yangi topshiriqlar',
        importance: 4,
        visibility: 1,
        vibration: true,
      }).catch(() => {
        // iOS'da kanal tushunchasi yo'q — e'tiborsiz
      })

      // Bildirishnoma bosilganda ilova ochiladi, lekin qayerga
      // o'tishni o'zi bilmaydi — Edge Function yuborgan `yol`
      // (`/bugun` yoki `/topshiriqlar`) shu yerda ishlatiladi
      const bildirishnomaVadasi = PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (harakat) => {
          const yol = harakat.notification.data?.yol
          if (typeof yol === 'string') router.push(yol)
        }
      )

      tozalash = () => {
        obunaYechish()
        tinglovchiVadasi.then((t) => t.remove())
        bildirishnomaVadasi.then((t) => t.remove())
      }
    })

    return () => tozalash()
  }, [router])

  // `useSearchParams` Suspense ichida bo'lishi shart (statik eksport)
  return (
    <Suspense fallback={null}>
      <OxirgiYolKuzatuvchi />
    </Suspense>
  )
}

/** Ilova qayta ochilganda shu sahifaga qaytiladi (`NativeDarvoza`) */
function OxirgiYolKuzatuvchi() {
  const router = useRouter()
  const yol = usePathname()
  const soroq = useSearchParams().toString()

  useEffect(() => {
    if (!ilovaNativemi() || !yol) return
    const toliq = soroq ? `${yol}?${soroq}` : yol
    // Sahifa haqiqiy fayli orqali ochilgan bo'lsa (`/bugun/index.html`,
    // izoh: native-darvoza.tsx) — manzilni odatiy ko'rinishga qaytaramiz
    const toza = faylYoliniTozala(toliq)
    if (toza) {
      router.replace(toza)
      return
    }
    oxirgiYolniSaqla(toliq)
  }, [yol, soroq, router])

  return null
}
