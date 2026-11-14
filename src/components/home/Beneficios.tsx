'use client'
import React from 'react'
import {
  Shield, QrCode, MapPin, Bell, Users, Wrench,
  Lock, Smartphone, AlertTriangle, Heart, Navigation, Award
} from 'lucide-react'

const beneficios = [
  {
    icono: QrCode,
    titulo: 'QR de emergencia único',
    descripcion: 'Código QR personalizado asociado permanentemente a tu perfil. Imprímelo en tu casco o moto.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icono: Shield,
    titulo: 'Identificación instantánea',
    descripcion: 'En caso de accidente, cualquier persona puede conocer tu identidad y contactos de emergencia en segundos.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icono: MapPin,
    titulo: 'Ubicación en tiempo real',
    descripcion: 'Comparte tu ubicación GPS exacta con tus contactos y servicios de emergencia cuando más lo necesitas.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icono: Bell,
    titulo: 'Alerta SOS',
    descripcion: 'Un botón de pánico envía una alerta inmediata a todos tus contactos autorizados con tu ubicación.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    icono: Wrench,
    titulo: 'Mapa de servicios',
    descripcion: 'Encuentra talleres, montallantas, grúas, gasolineras y más servicios cerca de tu ubicación actual.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icono: AlertTriangle,
    titulo: 'Alertas viales',
    descripcion: 'Recibe y reporta accidentes, cierres viales, obras y peligros en la carretera en tiempo real.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icono: Heart,
    titulo: 'Información médica',
    descripcion: 'Registra alergias, grupo sanguíneo y condiciones médicas que pueden ser críticas en una emergencia.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icono: Users,
    titulo: 'Comunidad motera',
    descripcion: 'Conéctate con clubs y comunidades, organiza salidas, comparte rutas y eventos con otros motociclistas.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icono: Lock,
    titulo: 'Control de privacidad',
    descripcion: 'Tú decides qué información es pública y cuál permanece privada. Tus datos bajo tu control.',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
  },
  {
    icono: Smartphone,
    titulo: 'App y web adaptable',
    descripcion: 'Disponible en Android, iPhone y cualquier navegador. Funciona igual de bien en móvil o computador.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icono: Navigation,
    titulo: 'Sin barreras de acceso',
    descripcion: 'El QR funciona para todos: sin importar edad, marca de moto, ciudad o nivel tecnológico.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
  {
    icono: Award,
    titulo: 'Cumplimiento legal',
    descripcion: 'Plataforma diseñada bajo la Ley 1581 de 2012 de protección de datos personales de Colombia.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
]

export default function Beneficios() {
  return (
    <section id="beneficios" className="section bg-dark-800">
      <div className="container-max">
        {/* Encabezado */}
        <div className="text-center mb-14">
          <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">
            Todo en uno
          </span>
          <h2 className="section-title mt-2">Todo lo que MotoSafe ofrece</h2>
          <p className="section-subtitle mx-auto text-center">
            Una plataforma completa diseñada para la seguridad, identidad y comunidad de los motociclistas colombianos.
          </p>
        </div>

        {/* Grid de beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {beneficios.map((item) => (
            <div
              key={item.titulo}
              className="card-hover group"
            >
              <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <item.icono className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-2">{item.titulo}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{item.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
