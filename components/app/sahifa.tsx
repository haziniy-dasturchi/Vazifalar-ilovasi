'use client'

/** Sahifa karkasi: sarlavha, qo'shimcha matn va bitta asosiy harakat */
export function Sahifa({
  sarlavha,
  tavsif,
  belgi,
  harakat,
  children,
}: {
  sarlavha: string
  tavsif?: string
  belgi?: React.ReactNode
  harakat?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10 md:px-8 md:pt-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {belgi}
            <h1 className="truncate text-2xl font-bold tracking-tight text-text-strong md:text-3xl">
              {sarlavha}
            </h1>
          </div>
          {tavsif && (
            <p className="mt-1 text-sm text-text-muted md:text-base">
              {tavsif}
            </p>
          )}
        </div>
        {harakat && <div className="shrink-0">{harakat}</div>}
      </header>

      {children}
    </div>
  )
}

/** Ro'yxat ichidagi guruh sarlavhasi ("Kechikkan", "Bugun" kabi) */
export function Guruh({
  sarlavha,
  soni,
  rang,
  children,
}: {
  sarlavha: string
  soni?: number
  rang?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-7">
      <h2
        className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold"
        style={{ color: rang ?? 'var(--text-muted)' }}
      >
        {sarlavha}
        {soni !== undefined && (
          <span className="text-text-faint">{soni}</span>
        )}
      </h2>
      {children}
    </section>
  )
}
