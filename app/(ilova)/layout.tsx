import { Shell } from '@/components/app/shell'

/**
 * Bu sahifalar hech qanday server ma'lumotini o'qimaydi — hammasi mijoz
 * tomonda (Supabase + React Query) olinadi. Kirish huquqini middleware
 * allaqachon tekshirgan. Shu sababli bu yerda `headers()`/`getUser()` kabi
 * dinamik API ishlatilmaydi — aks holda Next.js butun sahifani har bir
 * o'tishda serverda qaytadan render qilishga majbur bo'lib, telefonda
 * sahifalar orasida o'tish sezilarli sekinlashadi.
 */
export default function IlovaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Shell>{children}</Shell>
}
