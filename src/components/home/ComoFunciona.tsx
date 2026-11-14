'use client'
import React from 'react'
import { UserPlus, QrCode, Scan, PhoneCall } from 'lucide-react'

const pasos = [
  {
    numero: '01',
    icono: UserPlus,
    titulo: 'Regístrate',
    descripcion:
      'Crea tu cuenta gratis con tus datos personales, información de tu motocicleta y contactos de emergencia.',
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10 border-primary-500/20',
  },
  {
    numero: '02',
    icono: QrCode,
    titulo: 'Obtén tu QR',
    descripcion:
      'El sistema genera automáticamente tu código QR único. Descárgalo e imprímelo para tu casco, moto o carné.',
    color: 'text-accent-400',
    bgColor: 'bg-accent-500/10 border-accent-500/20',
  },
  {
    numero: '03',
    icono: Scan,
    titulo: 'Alguien te escanea',
    descripcion:
      'En caso de accidente, cualquier persona puede escanear tu QR con su celular sin descargar ninguna app.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    numero: '04',
    icono: PhoneCall,
    titulo: 'Reciben ayuda',
    descripcion:
      'Acceden a tus datos autorizados, contactos de emergencia y pueden solicitar ayuda compartiendo tu ubicación.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="section bg-dark-900">
      <div className="container-max">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest">
            Simple y efectivo
          </span>
          <h2 className="section-title mt-2">¿Cómo funciona MotoSafe?</h2>
          <p className="section-subtitle mx-auto text-center">
            En cuatro pasos, tu información y seguridad están siempre disponibles para quien te encuentre.
          </p>
        </div>

        {/* Pasos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pasos.map((paso, index) => (
            <div key={paso.numero} className="relative">
              {/* Línea conectora */}
              {index < pasos.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent z-0 -translate-y-1/2" />
              )}

              <div className={`card border ${paso.bgColor} h-full relative z-10 hover:scale-105 transition-transform duration-300`}>
                {/* Número */}
                <span className={`text-5xl font-display font-black ${paso.color} opacity-30 absolute top-4 right-4`}>
                  {paso.numero}
                </span>

                {/* Icono */}
                <div className={`w-14 h-14 rounded-2xl ${paso.bgColor} border flex items-center justify-center mb-5`}>
                  <paso.icono className={`w-7 h-7 ${paso.color}`} />
                </div>

                {/* Texto */}
                <h3 className="text-white font-semibold text-lg mb-2">{paso.titulo}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{paso.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Banner destacado */}
        <div className="mt-12 p-6 md:p-8 bg-gradient-to-r from-primary-900/50 to-dark-800 border border-primary-500/20 rounded-2xl text-center">
          <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            💡 <strong className="text-white">Lo más importante:</strong> cualquier persona puede escanear tu QR
            y ver tu información de emergencia{' '}
            <span className="text-accent-400 font-semibold">sin registrarse, sin contraseña y sin descargar ninguna aplicación.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
