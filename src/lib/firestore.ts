// ============================================================
// MOTOSAFE - Firestore DEMO (sin Firebase)
// Todas las funciones simulan éxito sin hacer llamadas reales
// ============================================================

export const COLECCIONES = {
  USUARIOS: 'usuarios',
  PERFILES: 'perfiles',
  MOTOCICLETAS: 'motocicletas',
  CONTACTOS_EMERGENCIA: 'contactos_emergencia',
  INFO_MEDICA: 'info_medica',
  REPORTES_EMERGENCIA: 'reportes_emergencia',
  ALERTAS_VIALES: 'alertas_viales',
  ESTABLECIMIENTOS: 'establecimientos',
  QR_CODES: 'qr_codes',
}

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export async function guardarPerfil(userId: string, datos: any) {
  await delay()
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_perfil_${userId}`, JSON.stringify(datos))
  }
}

export async function obtenerPerfil(userId: string) {
  await delay()
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`motosafe_perfil_${userId}`)
    return saved ? JSON.parse(saved) : null
  }
  return null
}

export async function guardarMotocicleta(userId: string, datos: any) {
  await delay()
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_moto_${userId}`, JSON.stringify(datos))
  }
}

export async function guardarContactoEmergencia(userId: string, datos: any) {
  await delay()
  if (typeof window !== 'undefined') {
    const key = `motosafe_contactos_${userId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push({ id: `contacto-${Date.now()}`, userId, ...datos })
    localStorage.setItem(key, JSON.stringify(existing))
  }
}

export async function guardarInfoMedica(userId: string, datos: any) {
  await delay()
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_medica_${userId}`, JSON.stringify(datos))
  }
}

export async function obtenerPerfilPublicoPorQR(userId: string) {
  await delay()

  // Si es el perfil demo, retorna datos ficticios
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

  // Buscar en localStorage (usuarios registrados en demo)
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
          id: ct.id,
          nombreCompleto: ct.nombreCompleto,
          parentesco: ct.parentesco,
          celular: ct.celular,
        })),
        infoMedica: med || undefined,
        qrActivo: true,
      }
    }
  }

  return null
}

export async function crearReporteEmergencia(datos: any) {
  await delay()
  const id = `reporte-${Date.now()}`
  if (typeof window !== 'undefined') {
    const reportes = JSON.parse(localStorage.getItem('motosafe_reportes') || '[]')
    reportes.push({ id, ...datos, timestamp: new Date().toISOString() })
    localStorage.setItem('motosafe_reportes', JSON.stringify(reportes))
  }
  return id
}

export async function obtenerReportesEmergencia() {
  await delay()
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem('motosafe_reportes') || '[]')
  }
  return []
}
