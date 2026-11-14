'use client'
import React, { useState, useEffect } from 'react'
import { Phone, MessageSquare, Navigation, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerPerfil, obtenerMotocicleta, obtenerContactosEmergencia, crearReporteEmergencia } from '@/lib/firestore'
import { obtenerServiciosEmergencia, generarMensajeSOS } from '@/lib/emergencias'
import { generarUrlWhatsApp, generarUrlMaps } from '@/lib/utils'
import type { MotocyclistProfile, Motocicleta, ContactoEmergencia } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function EmergenciasPage() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<MotocyclistProfile | null>(null)
  const [moto, setMoto] = useState<Motocicleta | null>(null)
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([])
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [sosActivo, setSosActivo] = useState(false)
  const [intervaloSOS, setIntervaloSOS] = useState<NodeJS.Timeout | null>(null)
  const [confirmandoSOS, setConfirmandoSOS] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      obtenerPerfil(user.uid),
      obtenerMotocicleta(user.uid),
      obtenerContactosEmergencia(user.uid),
    ]).then(([p, m, c]) => {
      setPerfil(p)
      setMoto(m)
      setContactos(c)
    })
    // Obtener ubicación
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos =>
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      )
    }
  }, [user])

  const servicios = obtenerServiciosEmergencia(perfil?.ciudad)

  const llamar = (numero: string, nombre: string) => {
    window.location.href = `tel:${numero.replace(/\s/g, '')}`
    toast.success(`Abriendo llamada a ${nombre}`)
  }

  const enviarSOS = async () => {
    if (!perfil || !user) return
    const mensaje = generarMensajeSOS({
      nombreMotociclista: `${perfil.nombres} ${perfil.apellidos}`,
      placa: moto?.placa,
      lat: ubicacion?.lat,
      lng: ubicacion?.lng,
      tipoEmergencia: 'EMERGENCIA SOS',
    })

    // Registrar en Firestore
    await crearReporteEmergencia({
      motociclista: { userId: user.uid, nombres: perfil.nombres, apellidos: perfil.apellidos, placa: moto?.placa },
      reportadoPor: { esAnonimo: false },
      tipoEmergencia: 'ACCIDENTE',
      ubicacion: {
        latitud: ubicacion?.lat || 0,
        longitud: ubicacion?.lng || 0,
        timestamp: new Date(),
        mapsUrl: ubicacion ? generarUrlMaps(ubicacion.lat, ubicacion.lng) : undefined,
      },
      estado: 'ACTIVO',
      serviciosContactados: ['CONTACTO_PERSONAL'],
    })

    // Enviar a todos los contactos autorizados
    const autorizados = contactos.filter(c => c.autorizadoNotificaciones)
    if (autorizados.length > 0) {
      const url = generarUrlWhatsApp(autorizados[0].celular, mensaje)
      window.open(url, '_blank')
      toast.success(`SOS enviado a ${autorizados[0].nombreCompleto}`)
    } else {
      toast.error('No tienes contactos de emergencia autorizados')
    }
  }

  const activarSOS = async () => {
    setConfirmandoSOS(false)
    setSosActivo(true)

    // Obtener ubicación de alta precisión
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      )
    }

    await enviarSOS()

    // Actualizar ubicación cada 30 segundos mientras SOS está activo
    const intervalo = setInterval(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        })
      }
    }, 30000)
    setIntervaloSOS(intervalo)
  }

  const desactivarSOS = () => {
    setSosActivo(false)
    if (intervaloSOS) clearInterval(intervaloSOS)
    setIntervaloSOS(null)
    toast.success('SOS desactivado')
  }

  const grupos = [
    { titulo: 'Ambulancia', emoji: '🚑', color: 'red', items: servicios.ambulancia },
    { titulo: 'Policía', emoji: '👮', color: 'blue', items: servicios.policia },
    { titulo: 'Bomberos', emoji: '🚒', color: 'orange', items: servicios.bomberos },
    { titulo: 'Tránsito', emoji: '🚦', color: 'yellow', items: servicios.transito },
    { titulo: 'Grúa / Mecánica', emoji: '🔧', color: 'green', items: servicios.grua },
  ]

  const colorMap: Record<string, string> = {
    red: 'bg-red-500/20 border-red-500/30 hover:border-red-500/60',
    blue: 'bg-blue-500/20 border-blue-500/30 hover:border-blue-500/60',
    orange: 'bg-orange-500/20 border-orange-500/30 hover:border-orange-500/60',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 hover:border-yellow-500/60',
    green: 'bg-green-500/20 border-green-500/30 hover:border-green-500/60',
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-white font-display font-bold text-2xl">Centro de emergencias</h1>
          <p className="text-white/40 text-sm mt-1">
            {ubicacion
              ? `📍 Ubicación activa: ${ubicacion.lat.toFixed(4)}, ${ubicacion.lng.toFixed(4)}`
              : '📍 Obteniendo ubicación...'}
          </p>
        </div>

        {/* BOTÓN SOS */}
        <div className={cn(
          'rounded-2xl p-6 border transition-all duration-300 text-center',
          sosActivo
            ? 'bg-red-900/40 border-red-500/60 emergency-pulse'
            : 'bg-dark-800 border-white/10'
        )}>
          {sosActivo ? (
            <>
              <div className="text-5xl mb-3 animate-bounce-slow">🆘</div>
              <p className="text-red-300 font-display font-bold text-xl mb-1">SOS ACTIVO</p>
              <p className="text-white/60 text-sm mb-4">Tu ubicación se está compartiendo con tus contactos</p>
              {ubicacion && (
                <a
                  href={generarUrlMaps(ubicacion.lat, ubicacion.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 text-xs underline block mb-4"
                >
                  Ver mi ubicación en Maps
                </a>
              )}
              <button onClick={desactivarSOS} className="btn-secondary">
                ✓ Desactivar SOS — Estoy bien
              </button>
            </>
          ) : confirmandoSOS ? (
            <>
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-2">¿Confirmas la emergencia?</p>
              <p className="text-white/50 text-sm mb-4">Se enviará una alerta a tus contactos autorizados con tu ubicación</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmandoSOS(false)} className="btn-secondary px-6">Cancelar</button>
                <button onClick={activarSOS} className="btn-emergency px-6">🆘 Confirmar SOS</button>
              </div>
            </>
          ) : (
            <>
              <Zap className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-white font-bold text-lg mb-2">Botón SOS de emergencia</p>
              <p className="text-white/50 text-sm mb-4">Envía una alerta inmediata a tus contactos con tu ubicación actual</p>
              <button
                onClick={() => setConfirmandoSOS(true)}
                className="btn-emergency text-xl py-5 px-10"
              >
                🆘 ACTIVAR SOS
              </button>
            </>
          )}
        </div>

        {/* Servicios de emergencia */}
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="card border border-white/10">
              <h2 className="text-white font-semibold mb-3">
                {grupo.emoji} {grupo.titulo}
              </h2>
              <div className="space-y-2">
                {grupo.items.map((servicio) => (
                  <div
                    key={servicio.numero}
                    className={cn('border rounded-xl p-3 flex items-center gap-3 transition-colors', colorMap[grupo.color])}
                  >
                    <span className="text-2xl">{servicio.icono}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{servicio.nombre}</p>
                      <p className="text-white/40 text-xs truncate">{servicio.descripcion}</p>
                    </div>
                    <div className="flex gap-2">
                      {ubicacion && (
                        <button
                          onClick={() => {
                            const msg = generarMensajeSOS({
                              nombreMotociclista: `${perfil?.nombres} ${perfil?.apellidos}`,
                              placa: moto?.placa,
                              lat: ubicacion.lat,
                              lng: ubicacion.lng,
                              tipoEmergencia: grupo.titulo,
                            })
                            navigator.clipboard.writeText(msg)
                            toast.success('Mensaje copiado — compártelo manualmente')
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                          title="Copiar mensaje"
                        >
                          <MessageSquare className="w-4 h-4 text-white/60" />
                        </button>
                      )}
                      <button
                        onClick={() => llamar(servicio.numero, servicio.nombre)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5"
                      >
                        <Phone className="w-4 h-4 text-white/60" />
                        <span className="text-white font-bold text-sm">{servicio.numero}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contactos personales */}
        {contactos.length > 0 && (
          <div className="card border border-white/10">
            <h2 className="text-white font-semibold mb-3">📞 Mis contactos de emergencia</h2>
            <div className="space-y-2">
              {contactos.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <div className="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0 font-bold text-primary-300">
                    {c.nombreCompleto.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.nombreCompleto}</p>
                    <p className="text-white/40 text-xs">{c.parentesco} · {c.celular}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${c.celular}`} className="p-2 bg-accent-500/20 hover:bg-accent-500/40 rounded-lg transition-colors">
                      <Phone className="w-4 h-4 text-accent-400" />
                    </a>
                    <button
                      onClick={() => {
                        const msg = generarMensajeSOS({
                          nombreMotociclista: `${perfil?.nombres} ${perfil?.apellidos}`,
                          placa: moto?.placa,
                          lat: ubicacion?.lat,
                          lng: ubicacion?.lng,
                        })
                        window.open(generarUrlWhatsApp(c.celular, msg), '_blank')
                      }}
                      className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-green-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-white/20 text-xs text-center leading-relaxed pb-4">
          ⚠️ Los números de emergencia corresponden a servicios oficiales de Colombia. Las llamadas se realizan desde tu dispositivo y requieren confirmación. MotoSafe no garantiza disponibilidad de servicios externos.
        </p>
      </div>
    </DashboardLayout>
  )
}
