'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield, Phone, MapPin, Navigation, User, Heart,
  MessageSquare, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'
import type { PerfilPublico } from '@/types'
import { obtenerServiciosEmergencia } from '@/lib/emergencias'
import { generarUrlMaps } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  perfil: PerfilPublico
  userId: string
}

type Ubicacion = { lat: number; lng: number } | null

export default function PerfilPublicoView({ perfil, userId }: Props) {
  const [ubicacion, setUbicacion] = useState<Ubicacion>(null)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [ubicacionManual, setUbicacionManual] = useState('')
  const [mostrarServicios, setMostrarServicios] = useState(true)
  const [llamando, setLlamando] = useState<string | null>(null)

  const servicios = obtenerServiciosEmergencia(perfil.ciudad)

  // Obtener ubicación automáticamente al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const solicitarUbicacion = (): Promise<Ubicacion> => {
    return new Promise((resolve) => {
      setObteniendoUbicacion(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUbicacion(loc)
          setObteniendoUbicacion(false)
          resolve(loc)
        },
        () => {
          setObteniendoUbicacion(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  /**
   * Al llamar a un servicio de emergencia:
   * 1. Obtiene la ubicación GPS si no la tiene
   * 2. Abre la llamada telefónica
   * 3. Muestra el link de Maps para compartir
   */
  const llamarEmergencia = async (numero: string, nombre: string) => {
    setLlamando(nombre)

    // Si es ambulancia, redirigir al flujo de solicitud
    if (nombre.toLowerCase().includes('ambulancia') || numero === '123') {
      let loc = ubicacion
      if (!loc) {
        toast.loading('Obteniendo tu ubicación...', { id: 'loc' })
        loc = await solicitarUbicacion()
        toast.dismiss('loc')
      }
      const solicitudId = `sol-${Date.now()}`
      setLlamando(null)
      window.location.href = `/ambulancia/solicitud/${solicitudId}`
      return
    }

    let loc = ubicacion
    if (!loc) {
      toast.loading('Obteniendo tu ubicación...', { id: 'loc' })
      loc = await solicitarUbicacion()
      toast.dismiss('loc')
    }

    if (loc) {
      const mapsUrl = generarUrlMaps(loc.lat, loc.lng)
      toast.success(
        (t) => (
          <div>
            <p className="font-semibold text-sm">📍 Ubicación lista</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs underline"
            >
              Comparte esta ubicación →
            </a>
          </div>
        ),
        { duration: 10000 }
      )
    } else {
      toast('No se pudo obtener ubicación GPS. Ingrésala manualmente.', { icon: '⚠️' })
    }

    // Iniciar llamada
    setTimeout(() => {
      window.location.href = `tel:${numero}`
      setLlamando(null)
    }, 800)
  }

  const enviarWhatsApp = (celular: string, nombre: string) => {
    const lat = ubicacion?.lat
    const lng = ubicacion?.lng
    const motociclista = `${perfil.nombres} ${perfil.apellidos}`
    const placa = perfil.moto?.placa ?? ''

    let msg = `🆘 *EMERGENCIA - MOTOSAFE*\n\n`
    msg += `Hola ${nombre}, necesito ayuda urgente.\n\n`
    msg += `👤 *Accidentado:* ${motociclista}\n`
    if (placa) msg += `🏍️ *Placa:* ${placa}\n`
    if (perfil.infoMedica?.grupoSanguineo) msg += `🩸 *Sangre:* ${perfil.infoMedica.grupoSanguineo}\n`
    if (perfil.infoMedica?.alergias) msg += `⚠️ *Alergias:* ${perfil.infoMedica.alergias}\n`
    if (lat && lng) {
      msg += `📍 *Ubicación:* https://www.google.com/maps?q=${lat},${lng}\n`
    } else if (ubicacionManual) {
      msg += `📍 *Lugar:* ${ubicacionManual}\n`
    }
    msg += `\n_Enviado desde MotoSafe_`

    const url = `https://wa.me/${celular.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const mapsUrl = ubicacion ? generarUrlMaps(ubicacion.lat, ubicacion.lng) : null

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-500 py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">MotoSafe</span>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              Perfil de emergencia
            </span>
          </div>
          <span className="text-red-200 text-xs">🆘 Sin registro</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Perfil ── */}
        <div className="card border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
              {perfil.fotoPerfil
                ? <img src={perfil.fotoPerfil} alt="Foto" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-white" />
              }
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-xl">
                {perfil.nombres} {perfil.apellidos}
              </h1>
              {perfil.ciudad && (
                <p className="text-white/50 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {perfil.ciudad}
                </p>
              )}
            </div>
          </div>

          {/* Moto */}
          {perfil.moto && (
            <div className="mt-4 p-3 bg-dark-700 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🏍️</span>
              <div>
                <p className="text-accent-400 font-bold tracking-wider">{perfil.moto.placa}</p>
                <p className="text-white/60 text-xs">
                  {perfil.moto.marca} {perfil.moto.modelo} · {perfil.moto.color}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Info médica ── */}
        {perfil.infoMedica && (
          <div className="card border border-red-500/30 bg-red-500/5">
            <p className="text-red-300 text-xs font-semibold mb-3 flex items-center gap-1">
              <Heart className="w-3 h-3" /> INFORMACIÓN MÉDICA — IMPORTANTE
            </p>
            <div className="grid grid-cols-2 gap-2">
              {perfil.infoMedica.grupoSanguineo && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-white/40 text-[10px] uppercase">Grupo sanguíneo</p>
                  <p className="text-white font-bold text-lg">🩸 {perfil.infoMedica.grupoSanguineo}</p>
                </div>
              )}
              {perfil.infoMedica.eps && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-white/40 text-[10px] uppercase">EPS</p>
                  <p className="text-white font-semibold text-sm">🏥 {perfil.infoMedica.eps}</p>
                </div>
              )}
            </div>
            {perfil.infoMedica.alergias && (
              <div className="mt-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-300 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Alergias
                </p>
                <p className="text-white/80 text-sm mt-0.5">{perfil.infoMedica.alergias}</p>
              </div>
            )}
            {perfil.infoMedica.condicionesMedicas && (
              <div className="mt-2 p-2.5 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase">Condiciones médicas</p>
                <p className="text-white/80 text-sm mt-0.5">{perfil.infoMedica.condicionesMedicas}</p>
              </div>
            )}
            {perfil.infoMedica.medicamentos && (
              <div className="mt-2 p-2.5 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase">Medicamentos actuales</p>
                <p className="text-white/80 text-sm mt-0.5">{perfil.infoMedica.medicamentos}</p>
              </div>
            )}
            {perfil.infoMedica.observaciones && (
              <div className="mt-2 p-2.5 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase">Observaciones</p>
                <p className="text-white/80 text-sm mt-0.5">{perfil.infoMedica.observaciones}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Ubicación ── */}
        <div className="card border border-white/10">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary-400" /> Ubicación del incidente
          </h2>

          {ubicacion ? (
            <div className="p-3 bg-accent-500/10 border border-accent-500/20 rounded-xl">
              <p className="text-accent-300 text-sm font-semibold">✓ GPS obtenido automáticamente</p>
              <p className="text-white/40 text-xs mt-0.5">
                {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
              </p>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary-400 text-xs underline mt-1 block">
                  Ver en Google Maps →
                </a>
              )}
            </div>
          ) : (
            <button onClick={solicitarUbicacion} disabled={obteniendoUbicacion}
              className="w-full btn-primary mb-3 py-2.5 text-sm">
              {obteniendoUbicacion ? '📍 Obteniendo ubicación...' : '📍 Obtener mi ubicación GPS'}
            </button>
          )}

          <div className="mt-3">
            <label className="text-white/40 text-xs block mb-1">O escribe la dirección manualmente</label>
            <input
              value={ubicacionManual}
              onChange={e => setUbicacionManual(e.target.value)}
              className="input-field text-sm py-2"
              placeholder="Carrera 10 con Calle 25, Bogotá..."
            />
          </div>
        </div>

        {/* ── Servicios de emergencia ── */}
        <div className="card border border-red-500/30 bg-red-500/5">
          <button
            onClick={() => setMostrarServicios(!mostrarServicios)}
            className="w-full flex items-center justify-between mb-1"
          >
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              🚨 LLAMAR EMERGENCIAS
            </h2>
            {mostrarServicios
              ? <ChevronUp className="w-5 h-5 text-white/40" />
              : <ChevronDown className="w-5 h-5 text-white/40" />}
          </button>
          <p className="text-white/30 text-xs mb-3">
            Al llamar se obtiene tu GPS automáticamente y puedes compartir la ubicación
          </p>

          {mostrarServicios && (
            <div className="space-y-3">
              {/* Ambulancia */}
              <div>
                <p className="text-red-300/60 text-xs uppercase tracking-wide mb-1.5">🚑 Ambulancia</p>
                {servicios.ambulancia.map(s => (
                  <button key={s.numero} onClick={() => llamarEmergencia(s.numero, s.nombre)}
                    disabled={llamando === s.nombre}
                    className="w-full flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 hover:border-red-400 active:scale-95 rounded-xl mb-2 text-left transition-all">
                    <span className="text-2xl">{s.icono}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{s.nombre}</p>
                      <p className="text-white/40 text-xs">{s.descripcion}</p>
                    </div>
                    <span className="text-red-300 font-bold text-lg">{s.numero}</span>
                  </button>
                ))}
              </div>

              {/* Policía */}
              <div>
                <p className="text-blue-300/60 text-xs uppercase tracking-wide mb-1.5">👮 Policía</p>
                {servicios.policia.map(s => (
                  <button key={s.numero} onClick={() => llamarEmergencia(s.numero, s.nombre)}
                    disabled={llamando === s.nombre}
                    className="w-full flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 hover:border-blue-400 active:scale-95 rounded-xl mb-2 text-left transition-all">
                    <span className="text-2xl">{s.icono}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{s.nombre}</p>
                      <p className="text-white/40 text-xs">{s.descripcion}</p>
                    </div>
                    <span className="text-blue-300 font-bold text-lg">{s.numero}</span>
                  </button>
                ))}
              </div>

              {/* Bomberos */}
              <div>
                <p className="text-orange-300/60 text-xs uppercase tracking-wide mb-1.5">🚒 Bomberos</p>
                {servicios.bomberos.map(s => (
                  <button key={s.numero} onClick={() => llamarEmergencia(s.numero, s.nombre)}
                    disabled={llamando === s.nombre}
                    className="w-full flex items-center gap-3 p-3 bg-orange-500/20 border border-orange-500/30 hover:border-orange-400 active:scale-95 rounded-xl mb-2 text-left transition-all">
                    <span className="text-2xl">{s.icono}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{s.nombre}</p>
                      <p className="text-white/40 text-xs">{s.descripcion}</p>
                    </div>
                    <span className="text-orange-300 font-bold text-lg">{s.numero}</span>
                  </button>
                ))}
              </div>

              {/* Grúa */}
              <div>
                <p className="text-green-300/60 text-xs uppercase tracking-wide mb-1.5">🔧 Grúa / Asistencia</p>
                {servicios.grua.map(s => (
                  <button key={s.numero} onClick={() => llamarEmergencia(s.numero, s.nombre)}
                    disabled={llamando === s.nombre}
                    className="w-full flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 hover:border-green-400 active:scale-95 rounded-xl mb-2 text-left transition-all">
                    <span className="text-2xl">{s.icono}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{s.nombre}</p>
                      <p className="text-white/40 text-xs">{s.descripcion}</p>
                    </div>
                    <span className="text-green-300 font-bold text-sm">{s.numero}</span>
                  </button>
                ))}
              </div>

              {/* Tránsito */}
              <div>
                <p className="text-yellow-300/60 text-xs uppercase tracking-wide mb-1.5">🚦 Tránsito</p>
                {servicios.transito.map(s => (
                  <button key={s.numero} onClick={() => llamarEmergencia(s.numero, s.nombre)}
                    disabled={llamando === s.nombre}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-400 active:scale-95 rounded-xl mb-2 text-left transition-all">
                    <span className="text-2xl">{s.icono}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{s.nombre}</p>
                    </div>
                    <span className="text-yellow-300 font-bold text-lg">{s.numero}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botón rápido siempre visible */}
          <button onClick={() => llamarEmergencia('123', 'Ambulancia 123')}
            className="w-full mt-3 py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-lg rounded-xl transition-all shadow-lg">
            🚑 SOLICITAR AMBULANCIA
          </button>
        </div>

        {/* ── Contactos de emergencia ── */}
        {perfil.contactosEmergencia.length > 0 && (
          <div className="card border border-white/10">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-400" /> Contactos de emergencia
            </h2>
            <div className="space-y-2">
              {perfil.contactosEmergencia.map((contacto) => (
                <div key={contacto.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <div className="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{contacto.nombreCompleto}</p>
                    <p className="text-white/40 text-xs">{contacto.parentesco}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${contacto.celular}`}
                      className="p-2 bg-accent-500/20 hover:bg-accent-500/40 rounded-lg transition-colors"
                      title="Llamar">
                      <Phone className="w-4 h-4 text-accent-400" />
                    </a>
                    <button
                      onClick={() => enviarWhatsApp(contacto.celular, contacto.nombreCompleto)}
                      className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg transition-colors"
                      title="WhatsApp con ubicación">
                      <MessageSquare className="w-4 h-4 text-green-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-2">
              💬 El botón de WhatsApp envía un mensaje con la ubicación GPS al contacto seleccionado.
            </p>
          </div>
        )}

        {/* Aviso legal */}
        <div className="p-4 bg-dark-700 border border-white/5 rounded-xl">
          <p className="text-white/30 text-xs text-center leading-relaxed">
            Este perfil es compartido por <strong className="text-white/50">{perfil.nombres}</strong> a través de MotoSafe con su autorización expresa. Las llamadas se realizan desde tu dispositivo.
          </p>
        </div>

        {/* CTA registro */}
        <div className="text-center pb-4">
          <p className="text-white/30 text-xs mb-2">¿Eres motociclista? Protégete también</p>
          <Link href="/registro" className="btn-primary text-sm py-2.5 px-6 inline-block">
            🏍️ Crear mi perfil gratis
          </Link>
        </div>
      </div>
    </div>
  )
}
