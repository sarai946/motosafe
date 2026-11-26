import type { Metadata } from 'next'
import RegistroCentralForm from '@/components/ambulancia/RegistroCentralForm'

export const metadata: Metadata = {
  title: 'Registrar Central de Ambulancias — MotoSafe',
}

export default function RegistroCentralPage() {
  return <RegistroCentralForm />
}
