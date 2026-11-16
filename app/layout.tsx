import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { DOMEN } from '@/lib/huquqiy'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const TAVSIF =
  'Samara — o‘zbek tilidagi bepul vazifalar va kunlik reja ilovasi. ' +
  'To-do ro‘yxati, vaqtli eslatmalar, papkalar va kunlik hisobot. ' +
  'Reklamasiz, internetsiz ham ishlaydi.'

export const metadata: Metadata = {
  metadataBase: new URL(DOMEN),
  title: {
    default: 'Samara — vazifalar va kunlik reja ilovasi',
    template: '%s · Samara',
  },
  description: TAVSIF,
  applicationName: 'Samara',
  /*
    `keywords` ataylab qisqa va halol: Google bu tegni 2009-yildan
    beri reyting uchun umuman hisobga olmaydi, lekin ba'zi kichik
    qidiruv tizimlari va ichki qidiruvlar o'qiydi. Shuning uchun bu
    yerga faqat ilova HAQIQATAN mos keladigan so'zlar yoziladi —
    begona brend nomlari emas.
  */
  keywords: [
    'Samara',
    'Samara ilova',
    'samarali kun',
    'vazifalar ilovasi',
    'to-do ro‘yxat',
    'todo ilova',
    'kunlik reja',
    'kun rejasi',
    'rejalashtirish ilovasi',
    'eslatma ilovasi',
    'vaqtni boshqarish',
    'pomodoro',
    'foydali ilova',
    'bepul ilova',
    'o‘zbek tilida ilova',
    'task manager',
    'daily planner',
    'список дел',
    'планировщик дня',
  ],
  authors: [{ name: 'Haziniy ilm maskani' }],
  creator: 'Haziniy ilm maskani',
  publisher: 'Haziniy ilm maskani',
  category: 'productivity',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Samara',
    locale: 'uz_UZ',
    url: DOMEN,
    title: 'Samara — vazifalar va kunlik reja ilovasi',
    description: TAVSIF,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samara — vazifalar va kunlik reja ilovasi',
    description: TAVSIF,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: 'Samara',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // Qorong'i mavzuda brauzer paneli ham qorayadi. Foydalanuvchi
  // mavzuni qo'lda tanlasa, `lib/mavzu.ts` shu tegni yangilaydi.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b3d2e' },
    { media: '(prefers-color-scheme: dark)', color: '#101312' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" className={inter.variable}>
      <body className="antialiased">
        {/*
          Mavzu sahifa CHIZILISHIDAN OLDIN qo'llanishi shart: aks holda
          qorong'i rejimdagi foydalanuvchi har safar bir lahza oq
          ekranni ko'radi.

          Oddiy <script> ishlatilgan — React uni hujjat boshiga o'zi
          ko'taradi va hidratsiyadan oldin bajaradi. <head> tegini
          qo'lda yozish MUMKIN EMAS: App Router'da u Next'ning o'z
          boshqaruviga xalaqit berib, hidratsiyani butunlay to'xtatadi
          (sinovda aniqlandi — sahifa chiziladi, lekin hech bir tugma
          ishlamay qoladi).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('samara-mavzu');if(m==='dark'||m==='light'){document.documentElement.dataset.mavzu=m;}}catch(e){}})();`,
          }}
        />
        {/*
          "beforeinstallprompt" hodisasi sahifa yuklanishi davomida
          HAR QANDAY vaqtda kelishi mumkin — ko'pincha React hali
          ulanmagan (hydrate bo'lmagan) paytda. Agar uni faqat
          <PwaOrnatish> ichidagi useEffect orqali tinglasak, React
          ulanishidan oldin kelgan hodisa butunlay yo'qolib ketadi va
          o'rnatish taklifi hech qachon chiqmaydi. Shu sababli uni
          React'dan oldin ishga tushadigan shu skript orqali eng
          boshida ushlab, window'ga saqlaymiz — <PwaOrnatish>
          ulanganda uni qayerdan topishni biladi.
        */}
        <Script id="ornatish-taklifini-ushlash" strategy="beforeInteractive">
          {`
            window.__samaraOrnatishTaklifi = null;
            window.addEventListener('beforeinstallprompt', function (e) {
              e.preventDefault();
              window.__samaraOrnatishTaklifi = e;
              window.dispatchEvent(new Event('samara:ornatish-tayyor'));
            });
            window.addEventListener('appinstalled', function () {
              window.__samaraOrnatishTaklifi = null;
              window.dispatchEvent(new Event('samara:ornatildi'));
            });
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
