import React from 'react'
import { HelpCircle } from 'lucide-react'

interface Pregunta {
  pregunta: string
  respuesta: string
}

const categorias: { titulo: string; emoji: string; preguntas: Pregunta[] }[] = [
  {
    titulo: 'Registro y cuenta',
    emoji: '👤',
    preguntas: [
      {
        pregunta: '¿Cómo me registro en MotoSafe?',
        respuesta:
          'Haz clic en "Registrarme gratis" e ingresa tus datos personales, información de tu motocicleta y tus contactos de emergencia. El proceso toma menos de 5 minutos y es completamente gratuito.',
      },
      {
        pregunta: '¿Necesito pagar para usar MotoSafe?',
        respuesta:
          'No. MotoSafe es una plataforma gratuita para todos los motociclistas. Podrás crear tu perfil, generar tu código QR y acceder a los servicios esenciales sin ningún costo.',
      },
      {
        pregunta: '¿Qué información debo registrar?',
        respuesta:
          'Registra tus datos personales básicos (nombre, cédula, teléfono), información de tu motocicleta (marca, modelo, placa, año), tus contactos de emergencia y, de forma opcional, tu información médica como grupo sanguíneo o alergias.',
      },
      {
        pregunta: '¿Mis datos están protegidos?',
        respuesta:
          'Sí. MotoSafe opera bajo la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. Tú decides qué información es visible públicamente y cuál permanece privada en tu perfil.',
      },
    ],
  },
  {
    titulo: 'Código QR',
    emoji: '📲',
    preguntas: [
      {
        pregunta: '¿Cómo funciona el código QR de emergencia?',
        respuesta:
          'Al registrarte, el sistema genera automáticamente un código QR único vinculado a tu perfil. Cualquier persona puede escanearlo con la cámara de su celular — sin instalar ninguna app — y acceder a tu información de emergencia autorizada.',
      },
      {
        pregunta: '¿Dónde debo pegar o imprimir el QR?',
        respuesta:
          'Lo más recomendado es en el casco (parte trasera o lateral), en la moto (zona visible), en tu carné o en una calcomanía resistente al agua. Cuantos más lugares, mayor probabilidad de que sea encontrado en caso de accidente.',
      },
      {
        pregunta: '¿Puedo actualizar mi QR si cambio de moto?',
        respuesta:
          'El código QR no cambia. Siempre apunta a tu perfil personal. Si cambias de moto, simplemente actualiza la información de tu motocicleta en tu perfil y el QR seguirá funcionando con los datos nuevos.',
      },
      {
        pregunta: '¿Qué ve alguien cuando escanea mi QR?',
        respuesta:
          'Ve únicamente la información que tú autorizaste como pública: tu nombre, foto de perfil, datos de tu moto, contactos de emergencia y, si lo habilitaste, tu información médica básica. No se expone información sensible sin tu permiso.',
      },
    ],
  },
  {
    titulo: 'Emergencias',
    emoji: '🚨',
    preguntas: [
      {
        pregunta: '¿Cómo activo una alerta SOS?',
        respuesta:
          'Desde el panel de emergencias en tu cuenta, puedes activar el botón SOS. Esto envía automáticamente una alerta con tu ubicación GPS exacta a todos tus contactos de emergencia registrados.',
      },
      {
        pregunta: '¿La persona que escanea mi QR puede llamar al 123?',
        respuesta:
          'Sí. La vista pública del QR incluye accesos directos para contactar ambulancia (123), policía y servicios de grúa. Además, se muestra tu ubicación en tiempo real para facilitar la asistencia.',
      },
      {
        pregunta: '¿MotoSafe reemplaza los servicios de emergencia oficiales?',
        respuesta:
          'No. MotoSafe es una herramienta complementaria que agiliza la identificación y el contacto de emergencia. Ante cualquier accidente siempre se debe llamar al número oficial de emergencias de Colombia: 123.',
      },
    ],
  },
  {
    titulo: 'Ubicación y mapa',
    emoji: '📍',
    preguntas: [
      {
        pregunta: '¿Cómo funciona el mapa de servicios para motociclistas?',
        respuesta:
          'Desde la sección "Mapa motero" puedes encontrar talleres, montallantas, grúas, gasolineras y otros servicios cerca de tu ubicación actual. El mapa se actualiza con reportes de la comunidad en tiempo real.',
      },
      {
        pregunta: '¿Puedo compartir mi ubicación con mis contactos de emergencia?',
        respuesta:
          'Sí. Al activar la función de ubicación, tus contactos autorizados pueden ver tu posición GPS en tiempo real. Esta función es opcional y tú decides cuándo activarla o desactivarla.',
      },
      {
        pregunta: '¿La ubicación se comparte siempre o solo en emergencias?',
        respuesta:
          'La compartición de ubicación está bajo tu control. Puedes activarla solo cuando la necesitas (por ejemplo, en un viaje largo) o de forma permanente si así lo prefieres. También se activa automáticamente al presionar el botón SOS.',
      },
    ],
  },
  {
    titulo: 'Servicios para motociclistas',
    emoji: '🏍️',
    preguntas: [
      {
        pregunta: '¿Qué es la comunidad motera de MotoSafe?',
        respuesta:
          'Es el espacio dentro de la plataforma donde los motociclistas pueden conectarse, unirse a clubes, organizar salidas, compartir rutas y eventos, y reportar alertas viales para ayudarse mutuamente.',
      },
      {
        pregunta: '¿Puedo reportar accidentes u obstáculos en la vía?',
        respuesta:
          'Sí. Desde la sección "Alertas viales" puedes reportar y recibir notificaciones sobre accidentes, derrumbes, cierres viales, obras y cualquier peligro en las carreteras colombianas.',
      },
      {
        pregunta: '¿En qué ciudades está disponible MotoSafe?',
        respuesta:
          'MotoSafe es una plataforma nacional disponible en todo Colombia. No hay restricción geográfica: cualquier motociclista colombiano puede registrarse y usar la plataforma sin importar su ciudad o municipio.',
      },
    ],
  },
]

export default function PreguntasFrecuentes() {
  return (
    <section id="preguntas-frecuentes" className="section bg-dark-900">
      <div className="container-max">

        {/* ── Encabezado ── */}
        <div className="text-center mb-14">
          <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest">
            Resolvemos tus dudas
          </span>
          <h2 className="section-title mt-2">Preguntas frecuentes</h2>
          <p className="section-subtitle mx-auto text-center">
            Todo lo que necesitas saber antes de registrarte y empezar a rodar con más seguridad.
          </p>
        </div>

        {/* ── Categorías ── */}
        <div className="space-y-10">
          {categorias.map((cat) => (
            <div key={cat.titulo}>
              {/* Título de categoría */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-primary-500/15 border border-primary-500/25 rounded-xl flex items-center justify-center text-xl">
                  {cat.emoji}
                </div>
                <h3 className="font-display font-semibold text-white text-lg">
                  {cat.titulo}
                </h3>
              </div>

              {/* Acordeón con details/summary */}
              <div className="space-y-3">
                {cat.preguntas.map((item) => (
                  <details
                    key={item.pregunta}
                    className="group card border border-white/10 hover:border-primary-500/40 transition-colors duration-300 open:border-primary-500/40"
                  >
                    <summary className="flex items-start justify-between gap-4 cursor-pointer select-none list-none py-1">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                        <span className="text-white font-medium text-sm leading-relaxed">
                          {item.pregunta}
                        </span>
                      </div>
                      {/* Chevron animado con CSS */}
                      <svg
                        className="w-4 h-4 text-white/40 shrink-0 mt-0.5 transition-transform duration-300 group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>

                    <div className="mt-4 pl-7 pr-1">
                      <p className="text-white/55 text-sm leading-relaxed border-l-2 border-primary-500/30 pl-4">
                        {item.respuesta}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA final ── */}
        <div className="mt-14 text-center p-8 bg-gradient-to-r from-primary-900/40 to-dark-800 border border-primary-500/20 rounded-2xl">
          <p className="text-white/80 text-base mb-5 max-w-xl mx-auto leading-relaxed">
            ¿Tienes una pregunta que no encontraste aquí?
            Escríbenos o regístrate y empieza a rodar con más seguridad hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:contacto@motosafe.app"
              className="btn-secondary text-sm py-3 px-6"
            >
              ✉️ Escríbenos
            </a>
            <a href="/registro" className="btn-primary text-sm py-3 px-6">
              🏍️ Registrarme gratis
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}
