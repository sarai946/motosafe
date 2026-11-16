// ============================================================
// MOTOSAFE - Firestore DEMO (sin Firebase)
// ============================================================

export const COLECCIONES = {
  USUARIOS: 'usuarios',
  PERFILES: 'perfiles',
  MOTOCICLETAS: 'motocicletas',
  CONTACTOS_EMERGENCIA: 'contactos_emergencia',
  INFO_MEDICA: 'info_medica',
  REPORTES_EMERGENCIA: 'reportes_emergencia',
  REPORTES: 'reportes',
  ALERTAS: 'alertas',
  ALERTAS_VIALES: 'alertas_viales',
  ESTABLECIMIENTOS: 'establecimientos',
  CLUBES: 'clubes',
  EVENTOS: 'eventos',
  QR_CODES: 'qr_codes',
  QR_TOKENS: 'qr_tokens',
}

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export async function guardarPerfil(userId: string, datos: any): Promise<void> {
  await delay()
  if (typeof window !== 'undefined') {
    const existing = JSON.parse(localStorage.getItem(`motosafe_perfil_${userId}`) || '{}')
    localStorage.setItem(`motosafe_perfil_${userId}`, JSON.stringify({ ...existing, ...datos }))
  }
}

export async function obtenerPerfil(userId: string): Promise<any> {
  await delay()
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`motosafe_perfil_${userId}`)
    return saved ? JSON.parse(saved) : null
  }
  return null
}

export async function guardarMotocicleta(userId: string, datos: any): Promise<void> {
  await delay()
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_moto_${userId}`, JSON.stringify(datos))
  }
}

export async function obtenerMotocicleta(userId: string): Promise<any> {
  await delay()
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`motosafe_moto_${userId}`)
    return saved ? JSON.parse(saved) : null
  }
  return null
}

export async function guardarContactoEmergencia(userId: string, datos: any): Promise<void> {
  await delay()
  if (typeof window !== 'undefined') {
    const key = `motosafe_contactos_${userId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push({ id: `contacto-${Date.now()}`, userId, ...datos })
    localStorage.setItem(key, JSON.stringify(existing))
  }
}

export async function obtenerContactosEmergencia(userId: string): Promise<any[]> {
  await delay()
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`motosafe_contactos_${userId}`)
    return saved ? JSON.parse(saved) : []
  }
  return []
}

export async function actualizarContactoEmergencia(id: string, datos: any): Promise<void> {
  await delay()
}

export async function eliminarContactoEmergencia(id: string): Promise<void> {
  await delay()
}

export async function guardarInfoMedica(userId: string, datos: any): Promise<void> {
  await delay()
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_medica_${userId}`, JSON.stringify(datos))
  }
}

export async function obtenerInfoMedica(userId: string): Promise<any> {
  await delay()
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`motosafe_medica_${userId}`)
    return saved ? JSON.parse(saved) : null
  }
  return null
}

export async function obtenerPerfilPublicoPorQR(userId: string): Promise<any> {
  await delay()
  if (userId === 'demo') {
    return {
      userId: 'demo',
      nombres: 'Carlos',
      apellidos: 'Rodríguez Pérez',
      ciudad: 'Bogotá',
      moto: { placa: 'ABC-123', marca: 'Honda', modelo: 'CB 500F', color: 'Negro' },
      contactosEmergencia: [
        { id: '1', nombreCompleto: 'María Pérez', parentesco: 'Esposa', celular: '+573001234567' },
      ],
      infoMedica: {
        grupoSanguineo: 'O+',
        eps: 'Sura EPS',
        alergias: 'Penicilina',
        condicionesMedicas: 'Ninguna',
        medicamentos: 'Ninguno',
        observaciones: 'Usar anestesia local con precaución.',
      },
      qrActivo: true,
    }
  }
  if (typeof window !== 'undefined') {
    const perfil = localStorage.getItem(`motosafe_perfil_${userId}`)
    const moto = localStorage.getItem(`motosafe_moto_${userId}`)
    const contactos = localStorage.getItem(`motosafe_contactos_${userId}`)
    const medica = localStorage.getItem(`motosafe_medica_${userId}`)
    if (perfil) {
      const p = JSON.parse(perfil)
      const m = moto ? JSON.parse(moto) : null
      const c = contactos ? JSON.parse(contactos) : []
      const med = medica ? JSON.parse(medica) : null
      return {
        userId,
        nombres: p.nombres,
        apellidos: p.apellidos,
        ciudad: p.ciudad,
        moto: m ? { placa: m.placa, marca: m.marca, modelo: m.modelo, color: m.color } : undefined,
        contactosEmergencia: c.map((ct: any) => ({
          id: ct.id, nombreCompleto: ct.nombreCompleto,
          parentesco: ct.parentesco, celular: ct.celular,
        })),
        infoMedica: med || undefined,
        qrActivo: true,
      }
    }
  }
  return null
}

export async function crearReporteEmergencia(datos: any): Promise<string> {
  await delay()
  const id = `reporte-${Date.now()}`
  if (typeof window !== 'undefined') {
    const reportes = JSON.parse(localStorage.getItem('motosafe_reportes') || '[]')
    reportes.push({ id, ...datos, timestamp: new Date().toISOString() })
    localStorage.setItem('motosafe_reportes', JSON.stringify(reportes))
  }
  return id
}

export async function obtenerReportesEmergencia(): Promise<any[]> {
  await delay()
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('motosafe_reportes') || '[]')
  }
  return []
}

export async function obtenerAlertasActivas(): Promise<any[]> {
  await delay()
  return []
}

export async function crearAlertaVial(datos: any): Promise<string> {
  await delay()
  return `alerta-${Date.now()}`
}

export async function actualizarVotoAlerta(id: string, tipo: string): Promise<void> {
  await delay()
}

export async function obtenerClubes(): Promise<any[]> {
  await delay()
  return []
}

export async function obtenerEventos(): Promise<any[]> {
  await delay()
  return []
}

export async function crearClub(datos: any): Promise<string> {
  await delay()
  return `club-${Date.now()}`
}

export async function crearEvento(datos: any): Promise<string> {
  await delay()
  return `evento-${Date.now()}`
}

export async function unirseAClub(clubId: string, userId: string): Promise<void> {
  await delay()
}

export async function salirDeClub(clubId: string, userId: string): Promise<void> {
  await delay()
}

export async function guardarVencimientosDocumentos(userId: string, datos: any): Promise<void> {
  await delay()
}

export async function agregarMantenimiento(userId: string, datos: any): Promise<string> {
  await delay()
  return `mant-${Date.now()}`
}

export async function eliminarMantenimiento(userId: string, id: string): Promise<void> {
  await delay()
}

export async function obtenerEstablecimientos(): Promise<any[]> {
  await delay()
  return []
}

export async function obtenerTodosEstablecimientos(): Promise<any[]> {
  await delay()
  return []
}

export async function crearEstablecimiento(datos: any): Promise<string> {
  await delay()
  return `est-${Date.now()}`
}

export async function actualizarEstablecimiento(id: string, datos: any): Promise<void> {
  await delay()
}

export async function eliminarEstablecimiento(id: string): Promise<void> {
  await delay()
}

export async function obtenerTodasAlertas(): Promise<any[]> {
  await delay()
  return []
}

export async function verificarAlerta(id: string, verificado: boolean): Promise<void> {
  await delay()
}

export async function obtenerTodosReportes(): Promise<any[]> {
  await delay()
  return []
}

export async function actualizarEstadoReporte(id: string, estado: string): Promise<void> {
  await delay()
}

export async function obtenerTodosUsuarios(): Promise<any[]> {
  await delay()
  return []
}

export async function actualizarEstadoUsuario(id: string, activo: boolean): Promise<void> {
  await delay()
}
