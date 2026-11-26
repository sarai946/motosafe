import type { Metadata } from 'next'
import DashboardCentral from '@/components/ambulancia/DashboardCentral'

export const metadata: Metadata = {
  title: 'Dashboard Central de Ambulancias — MotoSafe',
}

export default function DashboardCentralPage() {
  return <DashboardCentral />
}
