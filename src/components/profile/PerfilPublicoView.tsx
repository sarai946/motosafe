'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Shield, Phone, MapPin, Navigation, User, Heart,
  MessageSquare, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Camera, Send, X
} from 'lucide-react'
import type { PerfilPublico } from '@/types'
import { obtenerServiciosEmergencia } from '@/lib/emergencias'
import { generarUrlMaps } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Props {
  perfil: PerfilPublico
  userId: string
}

type Ubicacion = { lat: number; lng: number } | null
type TipoAyuda = 'emergencia' | 'carretera' | 'otro' | null
type PasoAmb = 'inicial' | 'foto' | 'enviando' | 'enviado'

const ICONOS_PRIORITARIOS = [
  { id: 'ambulancia', emoji: '🚑', label: 'Ambulancia',  color: 'bg-red-600',    numero: '123',              tipo: 'emergencia' as TipoAyuda },
  { id: 'policia',    emoji: '👮', label: 'Policía',     color: 'bg-blue-600',   numero: '112',              tipo: 'emergencia' as TipoAyuda },
  { id: 'bomberos',  emoji: '🚒', label: 'Bomberos',    color: 'bg-orange-600', numero: '119',              tipo: 'emergencia' as TipoAyuda },
  { id: 'grua',       emoji: '🔧', label: 'Grúa',        color: 'bg-green-600',  numero: '01 8000 112 320',  tipo: 'carretera' as TipoAyuda },
  { id: 'transito',   emoji: '🚦', label: 'Tránsito',    color: 'bg-yellow-600', numero: '127',              tipo: 'carretera' as TipoAyuda },
  { id: 'contactos',  emoji: '📞', label: 'Contactos',   color: 'bg-purple-600', numero: '',                 tipo: 'otro' as TipoAyuda },
]

export default function PerfilPublicoView({ perfil, userId }: Props) {
  const [ubicacion, setUbicacion]               = useState<Ubicacion>(null)
  const [obteniendoUbicacion, setObteniendoUb]  = useState(false)
  const [ubicacionManual, setUbicacionManual]   = useState('')
  const [mostrarServicios, setMostrarServicios] = useState(false)
  const [llamando, setLlamando]                 = useState<string | null>(null)
  const [iconoSeleccionado, setIconoSeleccionado] = useState<typeof ICONOS_PRIORITARIOS[0] | null>(null)
  const [tipoAyuda, setTipoAyuda]               = useState<TipoAyuda>(null)
  const [confirmacion, setConfirmacion]         = useState<string | null>(null)

  // Flujo ambulancia
  const [pasoAmb, setPasoAmb]   = useState<PasoAmb>('inicial')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const servicios = obtenerServiciosEmergencia(perfil.ciudad)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const solicitarUbicacion = (): Promise<Ubicacion> =>
    new Promise(resolve => {
      setObteniendoUb(true)
      navigator.geolocation.getCurrentPosition(
        pos => { const l = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUbicacion(l); setObteniendoUb(false); resolve(l) },
        () => { setObteniendoUb(false); resolve(null) },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })

  // ── Maneja la foto seleccionada ──────────────────────────────
  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setPasoAmb('enviando')

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = () => setFotoPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Subir foto a Supabase Storage
    let fotoUrl = ''
    try {
      const nombre = `accidente-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
      const { data, error } = await supabase.storage
        .from('fotos-accidentes')
        .upload(nombre, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('fotos-accidentes')
          .getPublicUrl(nombre)
        fotoUrl = urlData.publicUrl
      }
    } catch { /* si falla igual se envía sin foto */ }

    // Construir mensaje con el link real de la foto
    const loc = ubicacion
    const motociclista = `${perfil.nombres} ${perfil.apellidos}`
    const placa = perfil.moto?.placa ?? ''
    let msg = `🚑 *SOLICITUD DE AMBULANCIA - MOTOSAFE* 🚑\n`
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
    msg += `👤 *Accidentado:* ${motociclista}\n`
    if (placa) msg += `🏍️ *Placa:* ${placa}\n`
    if (perfil.infoMedica?.grupoSanguineo) msg += `🩸 *Sangre:* ${perfil.infoMedica.grupoSanguineo}\n`
    if (perfil.infoMedica?.eps) msg += `🏥 *EPS:* ${perfil.infoMedica.eps}\n`
    if (perfil.infoMedica?.alergias) msg += `⚠️ *Alergias:* ${perfil.infoMedica.alergias}\n`
    if (perfil.infoMedica?.condicionesMedicas) msg += `📋 *Condiciones:* ${perfil.infoMedica.condicionesMedicas}\n`
    msg += `\n`
    if (loc) msg += `📍 *_UBICACIÓN GPS_ 👇*\nhttps://www.google.com/maps?q=${loc.lat},${loc.lng}\n`
    else if (ubicacionManual) msg += `📍 *_LUGAR:_* ${ubicacionManual}\n`
    if (fotoUrl) msg += `\n📸 *_FOTO DEL ACCIDENTE_ 👇*\n${fotoUrl}\n`
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n`
    msg += `_MotoSafe · ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}_`

    setConfirmacion('✓ Solicitud enviada a la central de ambulancias')
    setPasoAmb('enviado')

    // Redirigir a WhatsApp con el link de la foto incluido
    window.location.href = `https://wa.me/573025341789?text=${encodeURIComponent(msg)}`
  }

  const abrirWhatsAppAmbulancia = () => {
    const loc = ubicacion
    const motociclista = `${perfil.nombres} ${perfil.apellidos}`
    const placa = perfil.moto?.placa ?? ''
    let msg = `🚑 *SOLICITUD DE AMBULANCIA - MOTOSAFE*\n\n`
    msg += `👤 *Accidentado:* ${motociclista}\n`
    if (placa) msg += `🏍️ *Placa:* ${placa}\n`
    if (perfil.infoMedica?.grupoSanguineo) msg += `🩸 *Sangre:* ${perfil.infoMedica.grupoSanguineo}\n`
    if (perfil.infoMedica?.eps) msg += `🏥 *EPS:* ${perfil.infoMedica.eps}\n`
    if (perfil.infoMedica?.alergias) msg += `⚠️ *Alergias:* ${perfil.infoMedica.alergias}\n`
    if (perfil.infoMedica?.condicionesMedicas) msg += `📋 *Condiciones:* ${perfil.infoMedica.condicionesMedicas}\n`
    if (loc) msg += `📍 *Ubicación GPS:* https://www.google.com/maps?q=${loc.lat},${loc.lng}\n`
    else if (ubicacionManual) msg += `📍 *Lugar:* ${ubicacionManual}\n`
    if (fotoPreview) msg += `📸 *Foto adjunta en la solicitud*\n`
    msg += `\n_MotoSafe · ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}_`
    window.location.href = `https://wa.me/573025341789?text=${encodeURIComponent(msg)}`
    setConfirmacion('✓ Solicitud enviada a la central de ambulancias')
    setPasoAmb('enviado')
  }

  const enviarSolicitudAmbulanciaConFoto = async (foto: File) => {
    setPasoAmb('enviando')
    toast.loading('Enviando solicitud...', { id: 'amb' })

    let loc = ubicacion
    if (!loc) loc = await solicitarUbicacion()

    let fotoUrl = ''
    try {
      const nombre = `accidente-${Date.now()}.${foto.name.split('.').pop()}`
      const { data, error } = await supabase.storage.from('fotos-accidentes').upload(nombre, foto, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('fotos-accidentes').getPublicUrl(nombre)
        fotoUrl = urlData.publicUrl
      }
    } catch { /* si falla la foto igual se envía */ }

    const motociclista = `${perfil.nombres} ${perfil.apellidos}`
    const placa = perfil.moto?.placa ?? ''
    let msg = `🚑 *SOLICITUD DE AMBULANCIA - MOTOSAFE*\n\n`
    msg += `👤 *Accidentado:* ${motociclista}\n`
    if (placa) msg += `🏍️ *Placa:* ${placa}\n`
    if (perfil.infoMedica?.grupoSanguineo) msg += `🩸 *Sangre:* ${perfil.infoMedica.grupoSanguineo}\n`
    if (perfil.infoMedica?.eps) msg += `🏥 *EPS:* ${perfil.infoMedica.eps}\n`
    if (perfil.infoMedica?.alergias) msg += `⚠️ *Alergias:* ${perfil.infoMedica.alergias}\n`
    if (perfil.infoMedica?.condicionesMedicas) msg += `📋 *Condiciones:* ${perfil.infoMedica.condicionesMedicas}\n`
    if (loc) msg += `📍 *Ubicación GPS:* https://www.google.com/maps?q=${loc.lat},${loc.lng}\n`
    else if (ubicacionManual) msg += `📍 *Lugar:* ${ubicacionManual}\n`
    if (fotoUrl) msg += `📸 *Foto del accidente:* ${fotoUrl}\n`
    msg += `\n_MotoSafe · ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}_`

    const encoded = encodeURIComponent(msg)
    toast.dismiss('amb')
    window.open(`https://wa.me/573025341789?text=${encoded}`, '_blank')
    setPasoAmb('enviado')
    setConfirmacion('✓ Solicitud enviada a la central de ambulancias')
  }

  // ── Acciones de los iconos de emergencia ─────────────────────
  const ejecutarAccion = async (icono: typeof ICONOS_PRIORITARIOS[0]) => {
    // Ambulancia — mostrar flujo de foto
    if (icono.id === 'ambulancia') {
      setPasoAmb('foto')
      // Abrir cámara automáticamente
      setTimeout(() => fileRef.current?.click(), 400)
      return
    }

    setLlamando(icono.id)
    let loc = ubicacion
    if (!loc) {
      toast.loading('Obteniendo ubicación...', { id: 'loc' })
      loc = await solicitarUbicacion()
      toast.dismiss('loc')
    }
    if (loc) {
      const mapsUrl = generarUrlMaps(loc.lat, loc.lng)
      toast.success(
        () => (
          <div>
            <p className="font-semibold text-sm">📍 Ubicación lista</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline">Compartir →</a>
          </div>
        ),
        { duration: 10000 }
      )
    }
    if (icono.id === 'contactos') { setConfirmacion('Mira los contactos abajo'); setLlamando(null); return }
    setConfirmacion(`Llamando a ${icono.label} — ${icono.numero}`)
    setTimeout(() => { window.location.href = `tel:${icono.numero}`; setLlamando(null) }, 800)
  }

  const seleccionarIcono = (icono: typeof ICONOS_PRIORITARIOS[0]) => {
    setIconoSeleccionado(icono)
    setTipoAyuda(icono.tipo)
    setConfirmacion(null)
    if (icono.id === 'ambulancia') { setPasoAmb('inicial') }
  }

  const enviarWhatsApp = (celular: string, nombre: string) => {
    const lat = ubicacion?.lat; const lng = ubicacion?.lng
    const motociclista = `${perfil.nombres} ${perfil.apellidos}`
    const placa = perfil.moto?.placa ?? ''
    let msg = `🆘 *EMERGENCIA - MOTOSAFE*\n\nHola ${nombre}, necesito ayuda urgente.\n\n`
    msg += `👤 *Accidentado:* ${motociclista}\n`
    if (placa) msg += `🏍️ *Placa:* ${placa}\n`
    if (perfil.infoMedica?.grupoSanguineo) msg += `🩸 *Sangre:* ${perfil.infoMedica.grupoSanguineo}\n`
    if (perfil.infoMedica?.alergias) msg += `⚠️ *Alergias:* ${perfil.infoMedica.alergias}\n`
    if (lat && lng) msg += `📍 *Ubicación:* https://www.google.com/maps?q=${lat},${lng}\n`
    else if (ubicacionManual) msg += `📍 *Lugar:* ${ubicacionManual}\n`
    msg += `\n_Enviado desde MotoSafe_`
    window.open(`https://wa.me/${celular.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const mapsUrl = ubicacion ? generarUrlMaps(ubicacion.lat, ubicacion.lng) : null

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Input oculto para cámara */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handleFoto} className="hidden" />

      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-500 py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">MotoSafe</span>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Perfil de emergencia</span>
          </div>
          <span className="text-red-200 text-xs">🆘 Sin registro</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── CUADRO: ¿Qué tipo de ayuda necesitas? ── */}
        <div className="card border border-red-500/30 bg-red-500/5">
          <p className="text-white font-bold text-sm mb-3 text-center">¿Qué tipo de ayuda necesitas?</p>

          {/* Botón grande SOLICITAR AMBULANCIA */}
          <button
            onClick={() => { seleccionarIcono(ICONOS_PRIORITARIOS[0]); setPasoAmb('foto'); setTimeout(() => fileRef.current?.click(), 400) }}
            className="w-full mb-3 py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-2"
            style={{ boxShadow: '0 0 25px rgba(220,38,38,0.4)' }}
          >
            🚑 SOLICITAR AMBULANCIA
          </button>

          {/* Iconos */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {ICONOS_PRIORITARIOS.map(icono => (
              <button key={icono.id} onClick={() => seleccionarIcono(icono)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  iconoSeleccionado?.id === icono.id
                    ? `${icono.color} border-white/50 scale-105`
                    : 'bg-dark-700 border-white/10 hover:border-white/30'
                }`}>
                <span className="text-2xl mb-1">{icono.emoji}</span>
                <span className="text-white text-xs font-semibold">{icono.label}</span>
              </button>
            ))}
          </div>

          {/* ── FLUJO AMBULANCIA ── */}
          {iconoSeleccionado?.id === 'ambulancia' && !confirmacion && (
            <div className="p-3 bg-dark-800 border border-red-500/30 rounded-xl space-y-3">
              <p className="text-white font-bold text-sm text-center">🚑 Solicitar Ambulancia</p>

              {/* Paso: tomar foto */}
              {pasoAmb === 'inicial' || pasoAmb === 'foto' ? (
                <>
                  <p className="text-white/60 text-xs text-center">
                    Toma una foto del accidente para adjuntarla a la solicitud
                  </p>

                  {fotoPreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={fotoPreview} alt="Foto accidente" className="w-full h-40 object-cover" />
                      </div>
                      <p className="text-white/60 text-xs text-center">✓ Foto lista — toca el botón para enviar</p>
                      <button
                        onClick={abrirWhatsAppAmbulancia}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        📲 ENVIAR SOLICITUD A LA CENTRAL
                      </button>
                      <button onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                        className="w-full py-2 text-white/40 text-xs">Cambiar foto</button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-red-500/40 rounded-xl flex flex-col items-center gap-2 text-white/50 hover:border-red-500/70 hover:text-white/70 transition-colors">
                      <Camera className="w-8 h-8" />
                      <span className="text-sm">Tomar / subir foto del accidente</span>
                      <span className="text-xs text-white/30">Se enviará automáticamente al tomarla</span>
                    </button>
                  )}

                  <button onClick={() => { setIconoSeleccionado(null); setPasoAmb('inicial'); setFotoFile(null); setFotoPreview(null) }}
                    className="w-full py-2 text-white/40 text-xs">Cancelar</button>
                </>
              ) : pasoAmb === 'enviando' ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white/60 text-sm">Enviando solicitud a la central...</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Otros iconos — selector de tipo */}
          {iconoSeleccionado && iconoSeleccionado.id !== 'ambulancia' && !confirmacion && (
            <div className="p-3 bg-dark-800 border border-white/10 rounded-xl space-y-3">
              <p className="text-white text-sm font-semibold text-center">
                {iconoSeleccionado.emoji} {iconoSeleccionado.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'emergencia', label: 'Emergencia', emoji: '🆘' },
                  { id: 'carretera',  label: 'Asistencia vial', emoji: '🛣️' },
                  { id: 'otro',       label: 'Otro servicio', emoji: '📋' },
                ].map(t => (
                  <button key={t.id} onClick={() => setTipoAyuda(t.id as TipoAyuda)}
                    className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                      tipoAyuda === t.id ? 'border-primary-500 bg-primary-500/20 text-white font-semibold' : 'border-white/10 bg-dark-700 text-white/60'
                    }`}>
                    <span className="text-lg block mb-1">{t.emoji}</span>{t.label}
                  </button>
                ))}
              </div>
              <button onClick={() => ejecutarAccion(iconoSeleccionado)} disabled={!!llamando}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                {llamando ? 'Activando...' : '📞 Activar llamada automáticamente'}
              </button>
              <button onClick={() => { setIconoSeleccionado(null); setTipoAyuda(null) }}
                className="w-full py-2 text-white/40 text-xs">Cancelar</button>
            </div>
          )}

          {/* Confirmación */}
          {confirmacion && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-green-300 text-sm font-semibold">{confirmacion}</p>
            </div>
          )}
        </div>

        {/* ── Perfil ── */}
        <div className="card border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
              {perfil.fotoPerfil
                ? <img src={perfil.fotoPerfil} alt="Foto" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-xl">{perfil.nombres} {perfil.apellidos}</h1>
              {perfil.ciudad && <p className="text-white/50 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {perfil.ciudad}</p>}
            </div>
          </div>
          {perfil.moto && (
            <div className="mt-4 p-3 bg-dark-700 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🏍️</span>
              <div>
                <p className="text-accent-400 font-bold tracking-wider">{perfil.moto.placa}</p>
                <p className="text-white/60 text-xs">{perfil.moto.marca} {perfil.moto.modelo} · {perfil.moto.color}</p>
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
                <p className="text-yellow-300 text-xs font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alergias</p>
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
                <p className="text-white/40 text-[10px] uppercase">Medicamentos</p>
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
              <p className="text-white/40 text-xs mt-0.5">{ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}</p>
              {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 text-xs underline mt-1 block">Ver en Google Maps →</a>}
            </div>
          ) : (
            <button onClick={solicitarUbicacion} disabled={obteniendoUbicacion} className="w-full btn-primary mb-3 py-2.5 text-sm">
              {obteniendoUbicacion ? '📍 Obteniendo ubicación...' : '📍 Obtener mi ubicación GPS'}
            </button>
          )}
          <div className="mt-3">
            <label className="text-white/40 text-xs block mb-1">O escribe la dirección manualmente</label>
            <input value={ubicacionManual} onChange={e => setUbicacionManual(e.target.value)}
              className="input-field text-sm py-2" placeholder="Carrera 10 con Calle 25, Bogotá..." />
          </div>
        </div>

        {/* ── Todos los servicios (expandible) ── */}
        <div className="card border border-red-500/30 bg-red-500/5">
          <button onClick={() => setMostrarServicios(!mostrarServicios)} className="w-full flex items-center justify-between mb-1">
            <h2 className="text-white font-bold text-base">🚨 Todos los servicios de emergencia</h2>
            {mostrarServicios ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
          </button>
          {mostrarServicios && (
            <div className="space-y-3 mt-3">
              {[
                { label: '🚑 Ambulancia',  items: servicios.ambulancia, color: 'bg-red-500/20 border-red-500/30',    text: 'text-red-300' },
                { label: '👮 Policía',     items: servicios.policia,    color: 'bg-blue-500/20 border-blue-500/30',   text: 'text-blue-300' },
                { label: '🚒 Bomberos',    items: servicios.bomberos,   color: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-300' },
                { label: '🔧 Grúa',        items: servicios.grua,       color: 'bg-green-500/20 border-green-500/30',  text: 'text-green-300' },
                { label: '🚦 Tránsito',    items: servicios.transito,   color: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-300' },
              ].map(g => (
                <div key={g.label}>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1.5">{g.label}</p>
                  {g.items.map(s => (
                    <button key={s.numero} onClick={() => { window.location.href = `tel:${s.numero}` }}
                      className={`w-full flex items-center gap-3 p-3 ${g.color} border hover:opacity-80 active:scale-95 rounded-xl mb-2 text-left transition-all`}>
                      <span className="text-2xl">{s.icono}</span>
                      <div className="flex-1"><p className="text-white font-semibold text-sm">{s.nombre}</p><p className="text-white/40 text-xs">{s.descripcion}</p></div>
                      <span className={`${g.text} font-bold text-lg`}>{s.numero}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Contactos de emergencia ── */}
        {perfil.contactosEmergencia.length > 0 && (
          <div className="card border border-white/10">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-400" /> Contactos de emergencia
            </h2>
            <div className="space-y-2">
              {perfil.contactosEmergencia.map(contacto => (
                <div key={contacto.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <div className="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{contacto.nombreCompleto}</p>
                    <p className="text-white/40 text-xs">{contacto.parentesco}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${contacto.celular}`} className="p-2 bg-accent-500/20 hover:bg-accent-500/40 rounded-lg transition-colors">
                      <Phone className="w-4 h-4 text-accent-400" />
                    </a>
                    <button onClick={() => enviarWhatsApp(contacto.celular, contacto.nombreCompleto)}
                      className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg transition-colors">
                      <MessageSquare className="w-4 h-4 text-green-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aviso legal */}
        <div className="p-4 bg-dark-700 border border-white/5 rounded-xl">
          <p className="text-white/30 text-xs text-center leading-relaxed">
            Este perfil es compartido por <strong className="text-white/50">{perfil.nombres}</strong> a través de MotoSafe con su autorización expresa.
          </p>
        </div>

        <div className="text-center pb-4">
          <p className="text-white/30 text-xs mb-2">¿Eres motociclista? Protégete también</p>
          <Link href="/registro" className="btn-primary text-sm py-2.5 px-6 inline-block">🏍️ Crear mi perfil gratis</Link>
        </div>
      </div>
    </div>
  )
}
