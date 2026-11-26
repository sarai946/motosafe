// ============================================================
// MOTOSAFE - Base de datos con Supabase PostgreSQL
// ============================================================
import { supabase } from './supabase'

export const COLECCIONES = {
  USUARIOS: 'usuarios',
  PERFILES: 'perfiles',
  MOTOCICLETAS: 'motocicletas',
  CONTACTOS_EMERGENCIA: 'contactos_emergencia',
  INFO_MEDICA: 'info_medica',
  REPORTES_EMERGENCIA: 'reportes_emergencia',
  REPORTES: 'reportes_emergencia',
  ALERTAS: 'alertas_viales',
  ALERTAS_VIALES: 'alertas_viales',
  ESTABLECIMIENTOS: 'establecimientos',
  CLUBES: 'clubes',
  EVENTOS: 'eventos',
  QR_CODES: 'perfiles',
  QR_TOKENS: 'perfiles',
  CONDUCTORES_AMBULANCIA: 'conductores_ambulancia',
  SOLICITUDES_AMBULANCIA: 'solicitudes_ambulancia',
}

// ── Helper: obtener id interno desde auth_id ────────────────
async function getInternalId(authId: string): Promise<string | null> {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', authId)
    .single()
  return data?.id || null
}

// ── Perfil ──────────────────────────────────────────────────

export async function guardarPerfil(userId: string, datos: any): Promise<void> {
  const mapped: any = { updated_at: new Date() }
  if (datos.nombres !== undefined) mapped.nombres = datos.nombres
  if (datos.apellidos !== undefined) mapped.apellidos = datos.apellidos
  if (datos.celular !== undefined) mapped.celular = datos.celular
  if (datos.ciudad !== undefined) mapped.ciudad = datos.ciudad
  if (datos.departamento !== undefined) mapped.departamento = datos.departamento
  if (datos.fotoPerfil !== undefined) mapped.foto_perfil = datos.fotoPerfil
  if (datos.qrActivo !== undefined) mapped.qr_activo = datos.qrActivo
  if (datos.qrCode !== undefined) mapped.qr_code = datos.qrCode
  if (datos.qr_activo !== undefined) mapped.qr_activo = datos.qr_activo
  if (datos.qr_code !== undefined) mapped.qr_code = datos.qr_code
  if (datos.tipo_documento !== undefined) mapped.tipo_documento = datos.tipo_documento
  if (datos.numero_documento !== undefined) mapped.numero_documento = datos.numero_documento
  if (datos.pais !== undefined) mapped.pais = datos.pais
  if (datos.profilePublico) {
    const p = datos.profilePublico
    mapped.mostrar_nombre = p.mostrarNombre ?? true
    mapped.mostrar_celular = p.mostrarCelular ?? false
    mapped.mostrar_ciudad = p.mostrarCiudad ?? true
    mapped.mostrar_placa_moto = p.mostrarPlacaMoto ?? true
    mapped.mostrar_contactos = p.mostrarContactosEmergencia ?? true
    mapped.mostrar_info_medica = p.mostrarInfoMedica ?? true
  }

  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')

  const { error } = await supabase
    .from('perfiles')
    .upsert({ user_id: internalId, ...mapped }, { onConflict: 'user_id' })
  if (error) { console.error('Error guardando perfil:', error); throw error }
}

export async function obtenerPerfil(userId: string): Promise<any> {
  const internalId = await getInternalId(userId)
  if (!internalId) return null
  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', internalId)
    .single()
  if (!data) return null
  return {
    ...data,
    nombres: data.nombres,
    apellidos: data.apellidos,
    celular: data.celular,
    ciudad: data.ciudad,
    departamento: data.departamento,
    qrActivo: data.qr_activo,
    qrCode: data.qr_code,
    fotoPerfil: data.foto_perfil,
    profilePublico: {
      mostrarNombre: data.mostrar_nombre ?? true,
      mostrarCelular: data.mostrar_celular ?? false,
      mostrarEmail: data.mostrar_email ?? false,
      mostrarCiudad: data.mostrar_ciudad ?? true,
      mostrarPlacaMoto: data.mostrar_placa_moto ?? true,
      mostrarFotoMoto: data.mostrar_foto_moto ?? true,
      mostrarContactosEmergencia: data.mostrar_contactos ?? true,
      mostrarInfoMedica: data.mostrar_info_medica ?? true,
    },
  }
}

// ── Motocicleta ─────────────────────────────────────────────

export async function guardarMotocicleta(userId: string, datos: any): Promise<void> {
  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')

  const mapped: any = { updated_at: new Date() }
  if (datos.placa !== undefined) mapped.placa = datos.placa
  if (datos.marca !== undefined) mapped.marca = datos.marca
  if (datos.modelo !== undefined) mapped.modelo = datos.modelo
  if (datos.cilindraje !== undefined) mapped.cilindraje = datos.cilindraje
  if (datos.color !== undefined) mapped.color = datos.color
  if (datos.anio !== undefined) mapped.anio = datos.anio
  if (datos.tipoMoto !== undefined) mapped.tipo_moto = datos.tipoMoto
  if (datos.tipo_moto !== undefined) mapped.tipo_moto = datos.tipo_moto
  if (datos.fotoMoto !== undefined) mapped.foto_moto = datos.fotoMoto

  const { error } = await supabase
    .from('motocicletas')
    .upsert({ user_id: internalId, ...mapped }, { onConflict: 'user_id' })
  if (error) { console.error('Error guardando moto:', error); throw error }
}

export async function obtenerMotocicleta(userId: string): Promise<any> {
  const internalId = await getInternalId(userId)
  if (!internalId) return null
  const { data } = await supabase
    .from('motocicletas')
    .select('*')
    .eq('user_id', internalId)
    .single()
  if (!data) return null
  return {
    ...data,
    soatVencimiento: data.soat_vencimiento,
    tecnomecanicaVencimiento: data.tecnomecanica_vencimiento,
    licenciaVencimiento: data.licencia_vencimiento,
    fotoMoto: data.foto_moto,
    historialMantenimiento: [],
  }
}

export async function guardarVencimientosDocumentos(userId: string, datos: any): Promise<void> {
  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')
  const mapped: any = {}
  if (datos.soatVencimiento !== undefined) mapped.soat_vencimiento = datos.soatVencimiento || null
  if (datos.tecnomecanicaVencimiento !== undefined) mapped.tecnomecanica_vencimiento = datos.tecnomecanicaVencimiento || null
  if (datos.licenciaVencimiento !== undefined) mapped.licencia_vencimiento = datos.licenciaVencimiento || null
  await supabase.from('motocicletas').update(mapped).eq('user_id', internalId)
}

export async function agregarMantenimiento(userId: string, datos: any): Promise<string> {
  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')
  const { data, error } = await supabase
    .from('mantenimientos')
    .insert({ user_id: internalId, ...datos })
    .select('id')
    .single()
  if (error) throw error
  return data?.id
}

export async function eliminarMantenimiento(userId: string, id: string): Promise<void> {
  await supabase.from('mantenimientos').delete().eq('id', id)
}

// ── Contactos de emergencia ─────────────────────────────────

export async function guardarContactoEmergencia(userId: string, datos: any): Promise<void> {
  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')
  const mapped: any = {}
  if (datos.nombreCompleto !== undefined) mapped.nombre_completo = datos.nombreCompleto
  if (datos.nombre_completo !== undefined) mapped.nombre_completo = datos.nombre_completo
  if (datos.parentesco !== undefined) mapped.parentesco = datos.parentesco
  if (datos.celular !== undefined) mapped.celular = datos.celular
  if (datos.email !== undefined) mapped.email = datos.email
  if (datos.autorizadoNotificaciones !== undefined) mapped.autorizado_notificaciones = datos.autorizadoNotificaciones
  if (datos.autorizado_notificaciones !== undefined) mapped.autorizado_notificaciones = datos.autorizado_notificaciones
  if (datos.esContactoPrincipal !== undefined) mapped.es_contacto_principal = datos.esContactoPrincipal
  if (datos.es_contacto_principal !== undefined) mapped.es_contacto_principal = datos.es_contacto_principal
  const { error } = await supabase.from('contactos_emergencia').insert({ user_id: internalId, ...mapped })
  if (error) { console.error('Error guardando contacto:', error); throw error }
}

export async function obtenerContactosEmergencia(userId: string): Promise<any[]> {
  const internalId = await getInternalId(userId)
  if (!internalId) return []
  const { data } = await supabase
    .from('contactos_emergencia')
    .select('*')
    .eq('user_id', internalId)
    .order('created_at', { ascending: true })
  return (data || []).map((c: any) => ({
    ...c,
    nombreCompleto: c.nombre_completo,
    autorizadoNotificaciones: c.autorizado_notificaciones,
    esContactoPrincipal: c.es_contacto_principal,
  }))
}

export async function actualizarContactoEmergencia(id: string, datos: any): Promise<void> {
  const mapped: any = {}
  if (datos.nombreCompleto !== undefined) mapped.nombre_completo = datos.nombreCompleto
  if (datos.nombre_completo !== undefined) mapped.nombre_completo = datos.nombre_completo
  if (datos.parentesco !== undefined) mapped.parentesco = datos.parentesco
  if (datos.celular !== undefined) mapped.celular = datos.celular
  if (datos.email !== undefined) mapped.email = datos.email
  if (datos.autorizadoNotificaciones !== undefined) mapped.autorizado_notificaciones = datos.autorizadoNotificaciones
  if (datos.esContactoPrincipal !== undefined) mapped.es_contacto_principal = datos.esContactoPrincipal
  const { error } = await supabase.from('contactos_emergencia').update(mapped).eq('id', id)
  if (error) throw error
}

export async function eliminarContactoEmergencia(id: string): Promise<void> {
  await supabase.from('contactos_emergencia').delete().eq('id', id)
}

// ── Info médica ─────────────────────────────────────────────

export async function guardarInfoMedica(userId: string, datos: any): Promise<void> {
  const internalId = await getInternalId(userId)
  if (!internalId) throw new Error('Usuario no encontrado')

  const mapped: any = { updated_at: new Date() }
  if (datos.grupoSanguineo !== undefined) mapped.grupo_sanguineo = datos.grupoSanguineo || null
  if (datos.grupo_sanguineo !== undefined) mapped.grupo_sanguineo = datos.grupo_sanguineo
  if (datos.eps !== undefined) mapped.eps = datos.eps
  if (datos.alergias !== undefined) mapped.alergias = datos.alergias
  if (datos.condicionesMedicas !== undefined) mapped.condiciones_medicas = datos.condicionesMedicas || null
  if (datos.condiciones_medicas !== undefined) mapped.condiciones_medicas = datos.condiciones_medicas
  if (datos.medicamentos !== undefined) mapped.medicamentos = datos.medicamentos
  if (datos.observaciones !== undefined) mapped.observaciones = datos.observaciones
  if (datos.mostrarEnEmergencia !== undefined) mapped.mostrar_en_emergencia = datos.mostrarEnEmergencia
  if (datos.mostrar_en_emergencia !== undefined) mapped.mostrar_en_emergencia = datos.mostrar_en_emergencia

  const { error } = await supabase
    .from('info_medica')
    .upsert({ user_id: internalId, ...mapped }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function obtenerInfoMedica(userId: string): Promise<any> {
  const internalId = await getInternalId(userId)
  if (!internalId) return null
  const { data } = await supabase
    .from('info_medica')
    .select('*')
    .eq('user_id', internalId)
    .single()
  if (!data) return null
  return {
    ...data,
    grupoSanguineo: data.grupo_sanguineo,
    condicionesMedicas: data.condiciones_medicas,
    mostrarEnEmergencia: data.mostrar_en_emergencia,
  }
}

// ── Perfil público (escaneo QR) ─────────────────────────────

export async function obtenerPerfilPublicoPorQR(userId: string): Promise<any> {
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
        grupoSanguineo: 'O+', eps: 'Sura EPS', alergias: 'Penicilina',
        condicionesMedicas: 'Ninguna', medicamentos: 'Ninguno',
        observaciones: 'Usar anestesia local con precaución.',
      },
      qrActivo: true,
    }
  }

  // userId aquí es el auth_id de Supabase
  const internalId = await getInternalId(userId)
  if (!internalId) return null

  const [{ data: perfil }, { data: moto }, { data: contactos }, { data: medica }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('user_id', internalId).single(),
    supabase.from('motocicletas').select('*').eq('user_id', internalId).single(),
    supabase.from('contactos_emergencia').select('*').eq('user_id', internalId),
    supabase.from('info_medica').select('*').eq('user_id', internalId).single(),
  ])

  if (!perfil || !perfil.qr_activo) return null

  return {
    userId,
    nombres: perfil.nombres,
    apellidos: perfil.apellidos,
    fotoPerfil: perfil.foto_perfil,
    ciudad: perfil.ciudad,
    moto: moto ? { placa: moto.placa, marca: moto.marca, modelo: moto.modelo, color: moto.color } : undefined,
    contactosEmergencia: (contactos || []).map((c: any) => ({
      id: c.id, nombreCompleto: c.nombre_completo, parentesco: c.parentesco, celular: c.celular,
    })),
    infoMedica: medica ? {
      grupoSanguineo: medica.grupo_sanguineo, eps: medica.eps,
      alergias: medica.alergias, condicionesMedicas: medica.condiciones_medicas,
      medicamentos: medica.medicamentos, observaciones: medica.observaciones,
    } : undefined,
    qrActivo: perfil.qr_activo,
  }
}

// ── Reportes de emergencia ──────────────────────────────────

export async function crearReporteEmergencia(datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('reportes_emergencia')
    .insert(datos)
    .select('id')
    .single()
  if (error) throw error
  return data?.id
}

export async function obtenerReportesEmergencia(): Promise<any[]> {
  const { data } = await supabase
    .from('reportes_emergencia')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function obtenerTodosReportes(limite?: number): Promise<any[]> {
  let query = supabase.from('reportes_emergencia').select('*').order('created_at', { ascending: false })
  if (limite) query = query.limit(limite)
  const { data } = await query
  return data || []
}

export async function actualizarEstadoReporte(id: string, estado: string): Promise<void> {
  await supabase.from('reportes_emergencia').update({ estado }).eq('id', id)
}

// ── Alertas viales ──────────────────────────────────────────

export async function obtenerAlertasActivas(): Promise<any[]> {
  const { data } = await supabase
    .from('alertas_viales').select('*').eq('activa', true).order('created_at', { ascending: false })
  return data || []
}

export async function crearAlertaVial(datos: any): Promise<string> {
  const payload: any = {
    tipo: datos.tipo,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    lat: datos.ubicacion?.latitud || null,
    lng: datos.ubicacion?.longitud || null,
    reportado_por: datos.reportadoPor || 'anonimo',
    verificada: false,
    activa: true,
    votos_util: 0,
    votos_no_util: 0,
  }
  const { data, error } = await supabase.from('alertas_viales').insert(payload).select('id').single()
  if (error) throw error
  return data?.id
}

export async function actualizarVotoAlerta(id: string, tipo: string): Promise<void> {
  const campo = tipo === 'util' ? 'votos_util' : 'votos_no_util'
  const { data: alerta } = await supabase.from('alertas_viales').select('votos_util, votos_no_util').eq('id', id).single()
  if (alerta) {
    const valorActual = tipo === 'util' ? (alerta.votos_util || 0) : (alerta.votos_no_util || 0)
    await supabase.from('alertas_viales').update({ [campo]: valorActual + 1 }).eq('id', id)
  }
}

export async function obtenerTodasAlertas(): Promise<any[]> {
  const { data } = await supabase.from('alertas_viales').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function verificarAlerta(id: string, verificado: boolean): Promise<void> {
  await supabase.from('alertas_viales').update({ verificada: verificado }).eq('id', id)
}

// ── Establecimientos ────────────────────────────────────────

export async function obtenerEstablecimientos(filtros?: {
  tipo?: string
  ciudad?: string
  es24h?: boolean
  servicioDomicilio?: boolean
}): Promise<any[]> {
  let query = supabase
    .from('establecimientos')
    .select('*')
    .eq('verificado', true)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros?.ciudad) query = query.ilike('ciudad', `%${filtros.ciudad}%`)
  if (filtros?.es24h) query = query.eq('es_24_horas', true)
  if (filtros?.servicioDomicilio) query = query.eq('servicio_domicilio', true)

  const { data } = await query
  return data || []
}

export async function obtenerTodosEstablecimientos(): Promise<any[]> {
  return obtenerEstablecimientos()
}

export async function crearEstablecimiento(datos: any): Promise<string> {
  const { data, error } = await supabase.from('establecimientos').insert(datos).select('id').single()
  if (error) throw error
  return data?.id
}

export async function actualizarEstablecimiento(id: string, datos: any): Promise<void> {
  await supabase.from('establecimientos').update(datos).eq('id', id)
}

export async function eliminarEstablecimiento(id: string): Promise<void> {
  await supabase.from('establecimientos').delete().eq('id', id)
}

// ── Usuarios (admin) ────────────────────────────────────────

export async function obtenerTodosUsuarios(): Promise<any[]> {
  const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function actualizarEstadoUsuario(id: string, activo: boolean): Promise<void> {
  await supabase.from('usuarios').update({ is_active: activo }).eq('id', id)
}

// ── Comunidad ───────────────────────────────────────────────

export async function obtenerClubes(): Promise<any[]> { return [] }
export async function obtenerEventos(): Promise<any[]> { return [] }
export async function crearClub(datos: any): Promise<string> { return `club-${Date.now()}` }
export async function crearEvento(datos: any): Promise<string> { return `evento-${Date.now()}` }
export async function unirseAClub(clubId: string, userId: string): Promise<void> {}
export async function salirDeClub(clubId: string, userId: string): Promise<void> {}

// ── Solicitudes de ambulancia ───────────────────────────────

export async function crearSolicitudAmbulancia(datos: any): Promise<string> {
  const { data, error } = await supabase.from('solicitudes_ambulancia').insert(datos).select('id').single()
  if (error) throw error
  return data?.id
}

export async function obtenerSolicitudesPendientes(): Promise<any[]> {
  const { data } = await supabase
    .from('solicitudes_ambulancia').select('*').eq('estado', 'PENDIENTE').order('created_at', { ascending: false })
  return data || []
}

export async function aceptarSolicitudAmbulancia(solicitudId: string, conductorId: string): Promise<void> {
  await supabase.from('solicitudes_ambulancia').update({
    estado: 'ACEPTADA', conductor_id: conductorId, aceptada_at: new Date(),
  }).eq('id', solicitudId)
}

export async function completarSolicitudAmbulancia(solicitudId: string): Promise<void> {
  await supabase.from('solicitudes_ambulancia').update({
    estado: 'COMPLETADA', completada_at: new Date(),
  }).eq('id', solicitudId)
}

// ── Solicitudes de registro de establecimientos ─────────────

export async function enviarSolicitudEstablecimiento(datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('solicitudes_establecimiento')
    .insert(datos)
    .select('id')
    .single()
  if (error) throw error
  return data?.id
}

export async function obtenerSolicitudesEstablecimiento(): Promise<any[]> {
  const { data } = await supabase
    .from('solicitudes_establecimiento')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function actualizarSolicitudEstablecimiento(id: string, datos: any): Promise<void> {
  const { error } = await supabase
    .from('solicitudes_establecimiento')
    .update({ ...datos, updated_at: new Date() })
    .eq('id', id)
  if (error) throw error
}

export async function aprobarSolicitudComoEstablecimiento(solicitud: any): Promise<void> {
  // 1. Crear el establecimiento
  const { error } = await supabase.from('establecimientos').insert({
    nombre: solicitud.nombre,
    tipo: solicitud.tipo,
    nit: solicitud.nit,
    representante: solicitud.representante,
    descripcion: solicitud.descripcion,
    direccion: solicitud.direccion,
    ciudad: solicitud.ciudad,
    localidad: solicitud.localidad,
    lat: solicitud.lat,
    lng: solicitud.lng,
    telefono: solicitud.telefono,
    whatsapp: solicitud.whatsapp,
    horarios: solicitud.horarios,
    es_24_horas: solicitud.es_24_horas,
    servicio_domicilio: solicitud.servicio_domicilio,
    servicios: solicitud.servicios,
    tarifas: solicitud.tarifas,
    habilitacion_legal: solicitud.habilitacion_legal,
    verificado: false, // el admin verifica manualmente después
    activo: true,
    estado: 'NO_CONFIRMADO',
  })
  if (error) throw error

  // 2. Marcar solicitud como aprobada
  await supabase
    .from('solicitudes_establecimiento')
    .update({ estado: 'APROBADA', updated_at: new Date() })
    .eq('id', solicitud.id)
}

// ── Calificaciones de establecimientos ──────────────────────

export async function calificarEstablecimiento(
  establecimientoId: string,
  authId: string,
  calificacion: number,
  comentario?: string
): Promise<void> {
  const { error } = await supabase
    .from('calificaciones_establecimiento')
    .upsert(
      { establecimiento_id: establecimientoId, auth_id: authId, calificacion, comentario },
      { onConflict: 'establecimiento_id,auth_id' }
    )
  if (error) throw error

  // Actualizar promedio en la tabla establecimientos
  const { data } = await supabase
    .from('calificaciones_establecimiento')
    .select('calificacion')
    .eq('establecimiento_id', establecimientoId)

  if (data && data.length > 0) {
    const promedio = data.reduce((sum: number, r: any) => sum + r.calificacion, 0) / data.length
    await supabase
      .from('establecimientos')
      .update({ calificacion: Math.round(promedio * 10) / 10 })
      .eq('id', establecimientoId)
  }
}

export async function obtenerTodosEstablecimientosAdmin(): Promise<any[]> {
  const { data } = await supabase
    .from('establecimientos')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}
