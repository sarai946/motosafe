'use client'
import React, { useEffect, useState } from 'react'
import { Download, Share2, Shield, RefreshCw, AlertTriangle, Copy, CheckCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerPerfil, obtenerMotocicleta } from '@/lib/firestore'
import { generarQRBase64, descargarQRPNG, descargarQRPDF, desactivarQR, reactivarQR, generarUrlPerfil } from '@/lib/qr'
import type { MotocyclistProfile, Motocicleta } from '@/types'
import toast from 'react-hot-toast'

export default function QRPage() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<MotocyclistProfile | null>(null)
  const [moto, setMoto] = useState<Motocicleta | null>(null)
  const [qrBase64, setQrBase64] = useState<string>('')
  const [cargando, setCargando] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!user) return
    const cargar = async () => {
      const [p, m, qr] = await Promise.all([
        obtenerPerfil(user.uid),
        obtenerMotocicleta(user.uid),
        generarQRBase64(user.uid),
      ])
      setPerfil(p)
      setMoto(m)
      setQrBase64(qr)
      setCargando(false)
    }
    cargar()
  }, [user])

  const copiarEnlace = () => {
    if (!user) return
    navigator.clipboard.writeText(generarUrlPerfil(user.uid))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Enlace copiado')
  }

  const handleDescargarPNG = () => {
    if (!user) return
    descargarQRPNG(user.uid, `motosafe-${perfil?.nombres?.toLowerCase() || 'qr'}`)
    toast.success('QR descargado como PNG')
  }

  const handleDescargarPDF = () => {
    if (!user || !perfil) return
    descargarQRPDF(user.uid, `${perfil.nombres} ${perfil.apellidos}`, moto?.placa)
    toast.success('Carné QR descargado como PDF')
  }

  const handleDesactivar = async () => {
    if (!user || !confirm('¿Seguro que deseas desactivar tu QR? Nadie podrá ver tu perfil hasta que lo reactives.')) return
    await desactivarQR(user.uid)
    setPerfil(prev => prev ? { ...prev, qrActivo: false } : null)
    toast.success('QR desactivado')
  }

  const handleReactivar = async () => {
    if (!user) return
    await reactivarQR(user.uid)
    setPerfil(prev => prev ? { ...prev, qrActivo: true } : null)
    toast.success('QR reactivado')
  }

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center">
          <div className="skeleton w-64 h-80 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        <div>
          <h1 className="text-white font-display font-bold text-2xl">Mi código QR</h1>
          <p className="text-white/40 text-sm mt-1">Este QR es tu identidad digital de emergencia</p>
        </div>

        {/* Estado */}
        {!perfil?.qrActivo && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-semibold text-sm">QR desactivado</p>
              <p className="text-red-400/70 text-xs">Tu perfil no es visible para otras personas</p>
            </div>
            <button onClick={handleReactivar} className="ml-auto btn-success text-sm py-2 px-4">
              Reactivar
            </button>
          </div>
        )}

        {/* Tarjeta QR */}
        <div className="card border border-white/10 flex flex-col items-center gap-4 p-8">
          {/* QR image */}
          {qrBase64 ? (
            <div className="relative">
              <div className="bg-white p-4 rounded-2xl shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrBase64} alt="Código QR MotoSafe" className="w-56 h-56" />
              </div>
              {/* Logo encima del QR */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center border-2 border-white">
                  <Shield className="w-5 h-5 text-primary-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-56 h-56 skeleton rounded-2xl" />
          )}

          {/* Nombre y placa */}
          <div className="text-center">
            <p className="text-white font-bold text-lg">{perfil?.nombres} {perfil?.apellidos}</p>
            {moto && (
              <p className="text-accent-400 font-bold text-base">{moto.placa}</p>
            )}
            <p className="text-white/40 text-xs mt-1">{moto?.marca} {moto?.modelo}</p>
          </div>

          {/* Enlace */}
          <div className="w-full flex items-center gap-2 bg-dark-700 border border-white/10 rounded-xl px-3 py-2">
            <p className="text-white/40 text-xs flex-1 truncate">
              {user ? generarUrlPerfil(user.uid) : ''}
            </p>
            <button onClick={copiarEnlace} className="shrink-0 text-primary-400 hover:text-primary-300">
              {copiado ? <CheckCircle className="w-4 h-4 text-accent-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleDescargarPNG} className="btn-primary flex items-center justify-center gap-2 py-3">
            <Download className="w-4 h-4" /> Descargar PNG
          </button>
          <button onClick={handleDescargarPDF} className="btn-success flex items-center justify-center gap-2 py-3">
            <Download className="w-4 h-4" /> Descargar Carné PDF
          </button>
        </div>

        {/* Instrucciones de uso */}
        <div className="card border border-white/10">
          <h2 className="text-white font-semibold mb-3">¿Cómo usar tu QR?</h2>
          <ul className="space-y-2.5">
            {[
              '🖨️ Imprímelo y pégalo en tu casco, chaqueta o motocicleta',
              '💳 Genera el carné PDF y laminalo para llevarlo en tu billetera',
              '📱 Comparte el enlace en tus redes o WhatsApp',
              '🔄 Puedes desactivarlo si lo pierdes y generar uno nuevo desde aquí',
              '🔒 Tu información sensible nunca aparece al escanear — solo lo que tú autorices',
            ].map((item) => (
              <li key={item} className="text-white/50 text-sm flex items-start gap-2">
                <span className="shrink-0">{item.slice(0, 2)}</span>
                <span>{item.slice(3)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Desactivar */}
        {perfil?.qrActivo && (
          <div className="card border border-red-500/20 bg-red-500/5">
            <h3 className="text-red-300 font-semibold text-sm mb-2">Zona de riesgo</h3>
            <p className="text-white/40 text-xs mb-3">
              Si perdiste tu QR o crees que fue comprometido, desactívalo inmediatamente.
            </p>
            <button
              onClick={handleDesactivar}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Desactivar QR actual
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
