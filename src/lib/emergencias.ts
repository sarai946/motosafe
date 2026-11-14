// ============================================================
// MOTOSAFE - Servicios de emergencia por región (Colombia)
// ============================================================

export interface ServicioEmergenciaInfo {
  nombre: string
  numero: string
  descripcion: string
  icono: string
  color: string
}

export interface RegionEmergencias {
  pais: string
  region?: string
  ambulancia: ServicioEmergenciaInfo[]
  policia: ServicioEmergenciaInfo[]
  bomberos: ServicioEmergenciaInfo[]
  transito: ServicioEmergenciaInfo[]
  grua: ServicioEmergenciaInfo[]
}

// Números de emergencia verificados para Colombia
// Fuente: Ministerio del Interior, Policía Nacional, Cruz Roja Colombiana
export const EMERGENCIAS_COLOMBIA: RegionEmergencias = {
  pais: 'Colombia',
  ambulancia: [
    {
      nombre: 'Línea de Emergencias Nacional',
      numero: '123',
      descripcion: 'Sistema de emergencias integrado - ambulancia, policía, bomberos',
      icono: '🚑',
      color: '#dc2626',
    },
    {
      nombre: 'Cruz Roja Colombiana',
      numero: '132',
      descripcion: 'Servicio de ambulancias Cruz Roja',
      icono: '🏥',
      color: '#dc2626',
    },
  ],
  policia: [
    {
      nombre: 'Policía Nacional',
      numero: '112',
      descripcion: 'Policía Nacional de Colombia',
      icono: '👮',
      color: '#1a56db',
    },
    {
      nombre: 'Línea de Emergencias',
      numero: '123',
      descripcion: 'Línea unificada de emergencias',
      icono: '🚔',
      color: '#1a56db',
    },
  ],
  bomberos: [
    {
      nombre: 'Bomberos',
      numero: '119',
      descripcion: 'Cuerpo de Bomberos de Colombia',
      icono: '🚒',
      color: '#ea580c',
    },
    {
      nombre: 'Línea de Emergencias',
      numero: '123',
      descripcion: 'Línea unificada de emergencias',
      icono: '🔥',
      color: '#ea580c',
    },
  ],
  transito: [
    {
      nombre: 'Tránsito y Transporte',
      numero: '127',
      descripcion: 'Autoridades de tránsito',
      icono: '🚦',
      color: '#ca8a04',
    },
    {
      nombre: 'Línea de Emergencias',
      numero: '123',
      descripcion: 'Línea unificada de emergencias',
      icono: '🛣️',
      color: '#ca8a04',
    },
  ],
  grua: [
    {
      nombre: 'Asistencia en carretera',
      numero: '01 8000 112 320',
      descripcion: 'Número orientativo - confirmar disponibilidad local',
      icono: '🔧',
      color: '#16a34a',
    },
  ],
}

// Números de emergencia por ciudades principales
export const EMERGENCIAS_CIUDADES: Record<string, Partial<RegionEmergencias>> = {
  bogota: {
    ambulancia: [
      {
        nombre: 'CRUE Bogotá',
        numero: '125',
        descripcion: 'Centro Regulador de Urgencias y Emergencias de Bogotá',
        icono: '🚑',
        color: '#dc2626',
      },
    ],
    transito: [
      {
        nombre: 'Secretaría de Movilidad Bogotá',
        numero: '195',
        descripcion: 'Secretaría de Movilidad de Bogotá',
        icono: '🚦',
        color: '#ca8a04',
      },
    ],
  },
  medellin: {
    ambulancia: [
      {
        nombre: 'SUMU Medellín',
        numero: '123',
        descripcion: 'Sistema de Urgencias Medellín',
        icono: '🚑',
        color: '#dc2626',
      },
    ],
  },
  cali: {
    ambulancia: [
      {
        nombre: 'CRUE Cali',
        numero: '123',
        descripcion: 'Centro Regulador de Urgencias Cali',
        icono: '🚑',
        color: '#dc2626',
      },
    ],
  },
}

/** Obtiene servicios de emergencia según ciudad */
export function obtenerServiciosEmergencia(ciudad?: string): RegionEmergencias {
  if (!ciudad) return EMERGENCIAS_COLOMBIA

  const ciudadNorm = ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const override = EMERGENCIAS_CIUDADES[ciudadNorm]

  if (!override) return EMERGENCIAS_COLOMBIA

  return {
    ...EMERGENCIAS_COLOMBIA,
    ...override,
    ambulancia: override.ambulancia || EMERGENCIAS_COLOMBIA.ambulancia,
    policia: override.policia || EMERGENCIAS_COLOMBIA.policia,
    bomberos: override.bomberos || EMERGENCIAS_COLOMBIA.bomberos,
    transito: override.transito || EMERGENCIAS_COLOMBIA.transito,
    grua: override.grua || EMERGENCIAS_COLOMBIA.grua,
  }
}

/** Genera un mensaje SOS para WhatsApp */
export function generarMensajeSOS(params: {
  nombreMotociclista: string
  placa?: string
  lat?: number
  lng?: number
  tipoEmergencia?: string
}): string {
  const { nombreMotociclista, placa, lat, lng, tipoEmergencia } = params
  const ahora = new Date()
  const fecha = ahora.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let msg = `🆘 *EMERGENCIA - MOTOSAFE*\n\n`
  msg += `Hola, necesito ayuda urgente.\n\n`
  msg += `👤 *Soy:* ${nombreMotociclista}\n`
  if (placa) msg += `🏍️ *Placa:* ${placa}\n`
  if (tipoEmergencia) msg += `⚠️ *Situación:* ${tipoEmergencia}\n`
  if (lat && lng) {
    msg += `📍 *Mi ubicación:* https://www.google.com/maps?q=${lat},${lng}\n`
  }
  msg += `🕐 *Hora:* ${fecha}\n\n`
  msg += `_Enviado desde MotoSafe_`

  return msg
}
