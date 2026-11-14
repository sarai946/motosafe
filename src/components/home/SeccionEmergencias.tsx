'use client'
import React from 'react'
import Link from 'next/link'

const servicios = [
  { emoji: '🚑', titulo: 'Ambulancia', numero: '123', descripcion: 'Servicio médico de emergencias', color: 'border-red-500/40 hover:border-red-500' },
  { emoji: '👮', titulo: 'Policía', numero: '112', descripcion: 'Policía Nacional de Colombia', color: 'border-blue-500/40 hover:border-blue-500' },
  { emoji: '🚒', titulo: 'Bomberos', numero: '119', descripcion: 'Cuerpo de Bomberos', color: 'border-orange-500/40 hover:border-orange-500' },
  { emoji: '🔧', titulo: 'Grúa', numero: 'App', descripcion: 'Asistencia mecánica y grúa', color: 'border-green-500/40 hover:border-green-500' },
  { emoji: '🚦', titulo: 'Tránsito', numero: '127', descripcion: 'Autoridades de tránsito', color: 'border-yellow-500/40 hover:border-yellow-500' },
  { emoji: '📞', titulo: 'Contactos', numero: 'Personales', descripcion: 'Tus contactos de emergencia', color: 'border-purple-500/40 hover:border-purple-500' },
]

export default function SeccionEmergencias() {
  return (
    <section id="emergencias" className="section bg-dark-900">
      <div className="container-max">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Texto */}
          <div>
            <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">
              Centro de emergencias
            </span>
            <h2 className="section-title mt-2">
              Ayuda inmediata,{' '}
              <span className="text-gradient">a un toque</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              MotoSafe pone todos los servicios de emergencia en un solo lugar.
              Cuando ocurre un accidente, cada segundo cuenta. Los botones de
              emergencia están diseñados para funcionar rápido, incluso bajo presión.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                '🗺️ Comparte tu ubicación GPS exacta automáticamente',
                '📱 Abre la aplicación de llamadas con un toque',
                '💬 Envía mensajes de emergencia por WhatsApp',
                '📋 El mensaje incluye nombre, placa y coordenadas',
                '📍 Si no hay GPS, puedes ingresar la ubicación manualmente',
              ].map((item) => (
                <li key={item} className="text-white/60 text-sm flex items-start gap-2">
                  <span className="shrink-0">{item.slice(0, 2)}</span>
                  <span>{item.slice(3)}</span>
                </li>
              ))}
            </ul>
            <Link href="/registro" className="btn-emergency inline-block">
              🆘 Configurar mi perfil de emergencia
            </Link>
          </div>

          {/* Grid de servicios */}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {servicios.map((s) => (
                <div
                  key={s.titulo}
                  className={`card border ${s.color} transition-all duration-300 cursor-default text-center group`}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{s.emoji}</div>
                  <h3 className="text-white font-bold text-sm mb-1">{s.titulo}</h3>
                  <p className="text-white/60 text-xs mb-2">{s.descripcion}</p>
                  <span className="inline-block bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {s.numero}
                  </span>
                </div>
              ))}
            </div>

            {/* Aviso importante */}
            <div className="mt-5 p-4 bg-dark-700 border border-white/10 rounded-xl">
              <p className="text-white/40 text-xs text-center leading-relaxed">
                ⚠️ Los números mostrados son los servicios oficiales de Colombia.
                MotoSafe no realiza llamadas automáticamente — abre la aplicación
                de tu teléfono para confirmar la llamada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
