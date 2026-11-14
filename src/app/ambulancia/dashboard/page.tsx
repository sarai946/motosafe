import type { Metadata } from 'next'
import DashboardAmbulancia from '@/components/ambulancia/DashboardAmbulancia'

export const metadata: Metadata = {
  title: 'Dashboard Conductor — MotoSafe',
  description: 'Panel del conductor de ambulancia. Recibe y gestiona solicitudes de emergencia.',
}

export default function DashboardAmbulanciaPage() {
  return <DashboardAmbulancia />
}
