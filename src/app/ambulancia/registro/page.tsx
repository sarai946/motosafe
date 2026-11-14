import type { Metadata } from 'next'
import RegistroAmbulanciaForm from '@/components/ambulancia/RegistroAmbulanciaForm'

export const metadata: Metadata = {
  title: 'Registrar ambulancia — MotoSafe',
  description: 'Registra tu ambulancia en MotoSafe y recibe solicitudes de emergencia cerca de ti.',
}

export default function RegistroAmbulanciaPage() {
  return <RegistroAmbulanciaForm />
}
