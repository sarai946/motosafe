'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Servicio {
  id: string
  emoji: string
  label: string
  color: string
  accion: () => void
}

interface Props {
  userId?: string
}

export default function SOSButton({ userId }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [obteniendo, setObteniendo] = useState(false)

  const obtenerUbicacion = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }

  const activarServicio = async (tipo: string, numero?: string) => {
    setAbierto(false)
    setObteniendo(true)
    toast.loading('Obteniendo tu ubicación...', { id: 'sos-loc' })
    const loc = await obtenerUbicacion()
    toast.dismiss('sos-loc')
    setObteniendo(false)

    if (tipo === 'ambulancia') {
      const id = `sol-${Date.now()}`
      router.push(`/ambulancia/solicitud/${id}`)
      return
    }

    if (loc) {
      const mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
      toast.success(
        (t) => (
          <div>
            <p className="font-semibold text-sm">📍 Ubicación lista</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 text-xs underline block mt-0.5">
              Compartir ubicación →
            </a>
          </div>
        ),
        { duration: 12000 }
      )
    }

    if (numero) {
      setTimeout(() => { window.location.href = `tel:${numero}` }, 600)
    }

    if (tipo === 'retenes') {
      toast('Activando alerta por voz y mostrando mapa...', { icon: '🗺️', duration: 4000 })
      setTimeout(() => router.push('/dashboard/mapa'), 1500)
    }
  }

  const SERVICIOS: Servicio[] = [
    {
      id: 'grua',
      emoji: '🔧',
      label: 'Grúa',
      color: 'bg-green-600',
      accion: () => activarServicio('grua', '01 8000 112 320'),
    },
    {
      id: 'transito',
      emoji: '🚦',
      label: 'Tránsito',
      color: 'bg-yellow-600',
      accion: () => activarServicio('transito', '127'),
    },
    {
      id: 'peatones',
      emoji: '🚶',
      label: 'Peatones',
      color: 'bg-purple-600',
      accion: () => activarServicio('peatones', '123'),
    },
    {
      id: 'ambulancia',
      emoji: '🚑',
      label: 'Ambulancia',
      color: 'bg-red-600',
      accion: () => activarServicio('ambulancia'),
    },
    {
      id: 'policia',
      emoji: '👮',
      label: 'Policía',
      color: 'bg-blue-600',
      accion: () => activarServicio('policia', '112'),
    },
    {
      id: 'retenes',
      emoji: '🗺️',
      label: 'Retenes',
      color: 'bg-orange-600',
      accion: () => activarServicio('retenes'),
    },
  ]

  // Posiciones en arco alrededor del botón SOS
  const posiciones = [
    { top: '-110px', left: '-50px' },   // Grúa
    { top: '-120px', left: '10px' },    // Tránsito
    { top: '-110px', left: '70px' },    // Peatones
    { top: '-40px',  left: '90px' },    // Ambulancia
    { top: '30px',   left: '70px' },    // Policía
    { top: '30px',   left: '-50px' },   // Retenes
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Burbujas de servicios */}
      {SERVICIOS.map((servicio, i) => (
        <button
          key={servicio.id}
          onClick={servicio.accion}
          className={`absolute flex flex-col items-center justify-center w-16 h-16 rounded-full ${servicio.color} text-white shadow-lg transition-all duration-300 ${
            abierto
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-0 pointer-events-none'
          }`}
          style={{
            ...posiciones[i],
            transitionDelay: abierto ? `${i * 40}ms` : '0ms',
          }}
        >
          <span className="text-xl">{servicio.emoji}</span>
          <span className="text-[9px] font-bold leading-none mt-0.5">{servicio.label}</span>
        </button>
      ))}

      {/* Overlay oscuro al abrir */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/50 z-[-1]"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Botón SOS principal */}
      <button
        onClick={() => setAbierto(!abierto)}
        disabled={obteniendo}
        className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-white text-lg shadow-2xl transition-all duration-300 ${
          abierto
            ? 'bg-gray-700 rotate-45 scale-110'
            : 'bg-red-600 hover:bg-red-500 hover:scale-110 animate-pulse'
        }`}
        style={{ boxShadow: abierto ? '0 0 0 0 transparent' : '0 0 20px rgba(220,38,38,0.6)' }}
      >
        {abierto ? '✕' : obteniendo ? '⏳' : 'SOS'}
      </button>
    </div>
  )
}
