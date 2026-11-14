'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Shield, MapPin, User, CheckCircle, Phone, Camera, Send, AlertTriangle } from 'lucide-react'
import type { SolicitudAmbulancia } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  solicitudId: string
}

// Pasos del flujo según diagrama 4
type Paso =
  | 'SELECCIONAR_AMBULANCIA'  // Escaneo QR → ingresar al sistema → seleccionar ambulancia
  | 'CAMARA'                   // Sistema abre cámara automáticamente
  | 'CONFIRMAR_ENVIO'          // Vista previa foto + botón enviar
  | 'BUSCANDO'                 // Enviado — buscando conductor
  | 'ACEPTADA'                 // Conductor aceptó

function useSolicitudDemo(id: string, iniciada: boolean) {
  const [solicitud, setSolicitud] = useState<SolicitudAmbulancia | null>(null)

  useEffect(() => {
    if (!iniciada) return
    setSolicitud({
      id,
      accidentado: {
        userId: 'demo',
        nombres: 'Carlos',
        apellidos: 'Rodríguez Pérez',
        placa: 'ABC-123',
        grupoSanguineo: 'O+',
        eps: 'Sura EPS',
        alergias: 'Penicilina',
      },
      solicitante: { esAnonimo: true },
      ubicacion: {
        lat: 4.6097,
        lng: -74.0817,
        direccion: 'Cra 7 con Calle 32, Bogotá',
        mapsUrl: 'https://www.google.com/maps?q=4.6097,-74.0817',
      },
      estado: 'PENDIENTE',
      conductoresRechazados: [],
      timestamp: new Date(),
      updatedAt: new Date(),
    })

    // Simula conductor aceptando a los 8 segundos
    const timer = setTimeout(() => {
      setSolicitud(prev => prev ? ({
        ...prev,
        estado: 'ACEPTADA',
        conductorAceptado: {
          conductorId: 'conductor-001',
          nombres: 'Pedro',
          apellidos: 'Gómez',
          celular: '+573001112233',
          placaAmbulancia: 'AMB-789',
          empresa: 'Cruz Roja Bogotá',
          tipoAmbulancia: 'Medicalizada',
          etaMinutos: 8,
        },
        updatedAt: new Date(),
      }) : prev)
    }, 8000)

    return () => clearTimeout(timer)
  }, [iniciada, id])

  return solicitud
}

const AMBULANCIAS_DEMO = [
  { id: 'amb-1', nombre: 'Cruz Roja Bogotá', tipo: 'Medicalizada', distancia: '1.2 km', eta: '5 min', disponible: true },
  { id: 'amb-2', nombre: 'Bomberos Norte', tipo: 'Básica', distancia: '2.1 km', eta: '8 min', disponible: true },
  { id: 'amb-3', nombre: 'Clínica Marly', tipo: 'Medicalizada', distancia: '3.4 km', eta: '12 min', disponible: false },
]

export default function SolicitudAmbulanciaView({ solicitudId }: Props) {
  const [paso, setPaso] = useState<Paso>('SELECCIONAR_AMBULANCIA')
  const [ambulanciaSeleccionada, setAmbulanciaSeleccionada] = useState<string | null>(null)
  const [foto, setFoto] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const solicitud = useSolicitudDemo(solicitudId, paso === 'BUSCANDO' || paso === 'ACEPTADA')

  // Contador de tiempo mientras busca
  useEffect(() => {
    if (paso !== 'BUSCANDO') return
    const interval = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [paso])

  // Detectar cuando el conductor acepta
  useEffect(() => {
    if (solicitud?.estado === 'ACEPTADA' && paso === 'BUSCANDO') {
      setPaso('ACEPTADA')
    }
  }, [solicitud?.estado, paso])

  // Abrir cámara automáticamente al llegar al paso CAMARA
  useEffect(() => {
    if (paso === 'CAMARA') {
      setTimeout(() => fileRef.current?.click(), 400)
    }
  }, [paso])

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFoto(reader.result as string)
      setPaso('CONFIRMAR_ENVIO')
    }
    reader.readAsDataURL(file)
  }

  const enviarSolicitud = async () => {
    setEnviando(true)
    toast.loading('Enviando solicitud a la central...', { id: 'envio' })
    await new Promise(r => setTimeout(r, 1500))
    toast.dismiss('envio')
    toast.success('¡Solicitud enviada! Información y foto llegaron a la central.')
    setEnviando(false)
    setPaso('BUSCANDO')
  }

  const conductor = solicitud?.conductorAceptado

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Input cámara oculto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFoto}
        className="hidden"
      />

      {/* Header */}
      <div className={`py-4 px-4 transition-all ${
        paso === 'ACEPTADA'
          ? 'bg-gradient-to-r from-green-700 to-green-500'
          : 'bg-gradient-to-r from-red-700 to-red-500'
      }`}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">MotoSafe — Ambulancias</span>
          </div>
          <span className="text-white/60 text-xs">#{solicitudId.slice(-4)}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── PASO 1: Seleccionar ambulancia ── */}
        {paso === 'SELECCIONAR_AMBULANCIA' && (
          <>
            <div>
              <h2 className="text-white font-bold text-lg">Ambulancias disponibles</h2>
              <p className="text-white/40 text-sm">Selecciona la unidad más cercana</p>
            </div>

            <div className="space-y-3">
              {AMBULANCIAS_DEMO.map(amb => (
                <button
                  key={amb.id}
                  disabled={!amb.disponible}
                  onClick={() => setAmbulanciaSeleccionada(amb.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    !amb.disponible
                      ? 'border-white/5 bg-dark-800 opacity-40 cursor-not-allowed'
                      : ambulanciaSeleccionada === amb.id
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 bg-dark-700 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚑</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{amb.nombre}</p>
                      <p className="text-white/50 text-xs">{amb.tipo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent-400 font-bold text-sm">{amb.distancia}</p>
                      <p className="text-white/40 text-xs">~{amb.eta}</p>
                    </div>
                  </div>
                  {!amb.disponible && (
                    <p className="text-white/30 text-xs mt-1">No disponible</p>
                  )}
                </button>
              ))}
            </div>

            <button
              disabled={!ambulanciaSeleccionada}
              onClick={() => setPaso('CAMARA')}
              className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              🚑 Solicitar ambulancia seleccionada
            </button>
          </>
        )}

        {/* ── PASO 2: Cámara (abre automáticamente) ── */}
        {paso === 'CAMARA' && (
          <div className="text-center space-y-5 py-8">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Camera className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-white font-bold text-xl">Abriendo cámara...</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Toma una foto del lugar del accidente.<br />
              Esta foto se adjuntará automáticamente a tu solicitud.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary py-3 px-8"
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Abrir cámara manualmente
            </button>
            <p className="text-white/20 text-xs">
              La cámara se abre automáticamente. Si no abre, usa el botón de arriba.
            </p>
          </div>
        )}

        {/* ── PASO 3: Confirmar envío con foto ── */}
        {paso === 'CONFIRMAR_ENVIO' && foto && (
          <>
            <div>
              <h2 className="text-white font-bold text-lg">Confirmar y enviar</h2>
              <p className="text-white/40 text-sm">Revisa la foto antes de enviar a la central</p>
            </div>

            {/* Foto adjunta */}
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <img src={foto} alt="Foto del accidente" className="w-full h-48 object-cover" />
              <div className="p-3 bg-dark-700 flex items-center justify-between">
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Foto adjunta a la solicitud
                </p>
                <button
                  onClick={() => { setFoto(null); setPaso('CAMARA') }}
                  className="text-red-400 text-xs underline"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* Resumen solicitud */}
            <div className="card border border-white/10 space-y-2">
              <p className="text-white/40 text-xs uppercase font-semibold">Resumen de la solicitud</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚑</span>
                <p className="text-white text-sm">
                  {AMBULANCIAS_DEMO.find(a => a.id === ambulanciaSeleccionada)?.nombre}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-400" />
                <p className="text-white/60 text-sm">Ubicación GPS obtenida</p>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary-400" />
                <p className="text-white/60 text-sm">1 foto adjunta</p>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-200/80 text-xs">
                La información y fotografía serán enviadas a la central de ambulancias. Un conductor aceptará tu solicitud en breve.
              </p>
            </div>

            <button
              onClick={enviarSolicitud}
              disabled={enviando}
              className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {enviando ? 'Enviando a la central...' : 'Enviar solicitud'}
            </button>
          </>
        )}

        {/* ── PASO 4: Buscando conductor ── */}
        {paso === 'BUSCANDO' && (
          <div className="card border border-red-500/30 bg-red-500/5 text-center py-8">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-1">Buscando conductor...</h2>
            <p className="text-white/50 text-sm">
              Notificando unidades cercanas · {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')}
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-white/30 text-xs mt-4">
              ✓ Información y foto enviadas a la central
            </p>
          </div>
        )}

        {/* ── PASO 5: Conductor aceptó ── */}
        {paso === 'ACEPTADA' && conductor && (
          <>
            <div className="card border border-green-500/30 bg-green-500/5 text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-white font-bold text-xl mb-1">¡Ambulancia en camino!</h2>
              <p className="text-green-300 font-semibold">Llega en ~{conductor.etaMinutos} minutos</p>
            </div>

            <div className="card border border-white/10">
              <p className="text-white/40 text-xs uppercase mb-3">Conductor asignado</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{conductor.nombres} {conductor.apellidos}</p>
                  <p className="text-white/60 text-sm">{conductor.empresa}</p>
                  <p className="text-white/40 text-xs">{conductor.tipoAmbulancia}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 bg-dark-700 rounded-xl">
                  <p className="text-white/40 text-[10px] uppercase">Placa</p>
                  <p className="text-white font-bold tracking-widest">{conductor.placaAmbulancia}</p>
                </div>
                <div className="p-2.5 bg-dark-700 rounded-xl">
                  <p className="text-white/40 text-[10px] uppercase">ETA</p>
                  <p className="text-white font-bold">{conductor.etaMinutos} min</p>
                </div>
              </div>
              <a href={`tel:${conductor.celular}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors">
                <Phone className="w-4 h-4" /> Llamar al conductor
              </a>
            </div>

            {solicitud?.ubicacion.mapsUrl && (
              <a href={solicitud.ubicacion.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="card border border-white/10 flex items-center gap-3 p-4">
                <MapPin className="w-5 h-5 text-accent-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{solicitud.ubicacion.direccion}</p>
                  <p className="text-primary-400 text-xs">Ver en Google Maps →</p>
                </div>
              </a>
            )}
          </>
        )}

        <div className="text-center pb-4">
          <Link href="/" className="text-white/30 text-xs underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
