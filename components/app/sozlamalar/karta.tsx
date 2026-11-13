'use client'

/** Sozlamalar bo'limlaridagi bitta karta — hamma joyda bir xil ko'rinish */
export function SozlamaKartasi({
  sarlavha,
  tavsif,
  children,
}: {
  sarlavha: string
  tavsif?: string
  children?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
      <h2 className="font-semibold text-text-strong">{sarlavha}</h2>
      {tavsif && (
        <p className="mt-1 text-sm leading-relaxed text-text-muted">{tavsif}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
