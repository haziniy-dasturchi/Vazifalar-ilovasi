import {
  BarChart3,
  CheckCircle2,
  FolderOpen,
  ListTodo,
  Moon,
  Play,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'

const QADAMLAR = [
  {
    ikonka: FolderOpen,
    sarlavha: 'Papka oching',
    matn: 'Loyihangiz turi — Ish, O‘qish, Uy.',
  },
  {
    ikonka: ListTodo,
    sarlavha: 'Bo‘lim qo‘shing',
    matn: 'Papka ichidagi kichik guruh.',
  },
  {
    ikonka: CheckCircle2,
    sarlavha: 'Vazifa yozing',
    matn: 'Sana, vaqt, muhimlikni belgilang.',
  },
  {
    ikonka: Play,
    sarlavha: 'Holatini belgilang',
    matn: 'Reja → Jarayonda → Bajarildi.',
  },
  {
    ikonka: Moon,
    sarlavha: 'Kechki reja tuzing',
    matn: 'Har kecha ertangi kunni rejalang.',
  },
  {
    ikonka: BarChart3,
    sarlavha: 'Hisobotda kuzating',
    matn: 'Natijangizni istalgan davr uchun ko‘ring.',
  },
]

export function YoriqnomaKorinishi() {
  return (
    <Sahifa sarlavha="Yo‘riqnoma" tavsif="Ilova shunchaki shunday ishlaydi">
      <ol className="space-y-3">
        {QADAMLAR.map((q, i) => (
          <li
            key={q.sarlavha}
            className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-bold text-brand-primary">
              {i + 1}
            </span>
            <q.ikonka className="size-5 shrink-0 text-brand-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-strong">{q.sarlavha}</p>
              <p className="text-sm text-text-muted">{q.matn}</p>
            </div>
          </li>
        ))}
      </ol>
    </Sahifa>
  )
}
