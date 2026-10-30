import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vazifalar',
    short_name: 'Vazifalar',
    description:
      'Kunlik vazifalarni rejalashtirish va bajarish uchun sodda ilova.',
    lang: 'uz',
    start_url: '/bugun',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#003933',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
