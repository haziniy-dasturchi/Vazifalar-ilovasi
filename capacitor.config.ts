import type { CapacitorConfig } from '@capacitor/cli'

/**
 * `webDir` — `npm run build:app` natijasi (statik eksport). `server.url`
 * ATAYLAB berilmagan: aks holda ilova shunchaki saytni ochadigan "o'ram"
 * bo'lib qolardi — internetsiz ishlamaydi, do'konlar buni rad etadi.
 */
const config: CapacitorConfig = {
  appId: 'uz.samaralikun.samara',
  appName: 'Samara',
  webDir: 'out',
  /*
    Capacitor debug build'da har bir plagin chaqiruvi natijasini logcat'ga
    yozadi — shu jumladan `Preferences.get` qaytargan Supabase sessiyasi
    (access + refresh token). USB ulangan har qanday kompyuter uni o'qiy
    oladi. Release'da sukut bo'yicha o'chiq, lekin debug'da ham kerak emas.
  */
  loggingBehavior: 'none',
  android: {
    // WebView'da aralash (https sahifa ichida http so'rov) tarkib bo'lmaydi
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      // Shell o'zi mavzuga qarab yorug'/qorong'i qo'yadi — bu shunchaki
      // ishga tushishdagi boshlang'ich qiymat
      style: 'DARK',
      // Android 15+ holat panelini "edge-to-edge" qiladi va rangni
      // o'zi belgilab bo'lmaydi — shuning uchun kontent panel OSTIGA
      // chiqadi deb hisoblaymiz, joylashuv esa CSS `safe-area-inset-top`
      // orqali tuzatiladi (`components/app/mobil-sarlavha.tsx`)
      overlaysWebView: true,
    },
    /*
      Android'da ilova OCHIQ turganda FCM xabari sukut bo'yicha faqat JS
      tinglovchiga beriladi, ekranda hech narsa chiqmaydi — odam
      ilovadan foydalanib o'tirgan paytda eslatmani ko'rmay qolardi.
      'alert' bo'lsa, plagin uni oddiy bildirishnoma sifatida ko'rsatadi.
    */
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    /**
     * Faqat Google kerak. Qolganlari o'chirilmasa, APK/IPA ichiga
     * Facebook SDK va uning ruxsatlari ham qo'shilib ketadi — bu
     * Play Console'da qo'shimcha savol-javobga (sabab ko'rsatish)
     * olib kelishi mumkin.
     */
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
}

export default config
