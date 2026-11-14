import type { Metadata } from 'next'
import SolicitudAmbulanciaView from '@/components/ambulancia/SolicitudAmbulanciaView'

export const metadata: Metadata = {
  title: 'Solicitud de ambulancia — MotoSafe',
}

interface Props {
  params: { id: string }
}

export default function SolicitudAmbulanciaPage({ params }: Props) {
  return <SolicitudAmbulanciaView solicitudId={params.id} />
}
