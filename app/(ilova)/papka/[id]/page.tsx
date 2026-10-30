import { PapkaKorinishi } from '@/components/sahifalar/papka'

export default async function PapkaSahifasi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PapkaKorinishi papkaId={id} />
}
