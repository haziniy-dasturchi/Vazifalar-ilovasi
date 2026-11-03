import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://vazifalar-eta.vercel.app'),
  title: {
    default: 'Samara',
    template: '%s · Samara',
  },
  description:
    'Kunlik vazifalarni rejalashtirish va bajarish uchun sodda ilova. Hamma uchun bepul. Har kun — samarali kun.',
  applicationName: 'Samara',
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
  themeColor: '#0b3d2e',
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
