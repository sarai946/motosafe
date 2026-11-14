import type { Metadata } from 'next'
import PerfilPublicoView from '@/components/profile/PerfilPublicoView'
import type { PerfilPublico } from '@/types'

export const metadata: Metadata = {
  title: 'Carlos Rodríguez — Perfil de emergencia | MotoSafe',
  description: 'Perfil de emergencia de demostración de MotoSafe. Escanea el QR para ver cómo funciona.',
}

const PERFIL_DEMO: PerfilPublico = {
  userId: 'demo',
  nombres: 'Carlos',
  apellidos: 'Rodríguez Pérez',
  fotoPerfil: undefined,
  ciudad: 'Bogotá',
  moto: {
    placa: 'ABC-123',
    marca: 'Honda',
    modelo: 'CB 500F',
    color: 'Negro',
  },
  contactosEmergencia: [
    {
      id: '1',
      nombreCompleto: 'María Pérez',
      parentesco: 'Esposa',
      celular: '+573001234567',
    },
    {
      id: '2',
      nombreCompleto: 'Jorge Rodríguez',
      parentesco: 'Hermano',
      celular: '+573009876543',
    },
  ],
  infoMedica: {
    grupoSanguineo: 'O+',
    eps: 'Sura EPS',
    alergias: 'Penicilina, Ibuprofeno',
    condicionesMedicas: 'Ninguna',
    medicamentos: 'Ninguno',
    observaciones: 'Usar anestesia local con precaución.',
  },
  qrActivo: true,
}

export default function PerfilDemoPage() {
  return (
    <div>
      {/* Banner de demo */}
      <div className="bg-primary-600/90 text-white text-center py-2 px-4 text-xs font-medium">
        👆 Este es un perfil de demostración — crea el tuyo gratis en MotoSafe
      </div>
      <PerfilPublicoView perfil={PERFIL_DEMO} userId="demo" />
    </div>
  )
}
