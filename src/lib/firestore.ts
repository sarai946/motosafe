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

// ── Perfil ──────────────────────────────────────────────────

export async function guardarPerfil(userId: string, datos: any): Promise<void> {
  const { error } = await supabase
    .from('perfiles')
    .upsert({ user_id: userId, ...datos, updated_at: new Date() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function obtenerPerfil(userId: string): Promise<any> {
  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', userId)
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
  const { error } = await supabase
    .from('motocicletas')
    .upsert({ user_id: userId, ...datos, updated_at: new Date() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function obtenerMotocicleta(userId: string): Promise<any> {
  const { data } = await supabase
    .from('motocicletas')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function guardarVencimientosDocumentos(userId: string, datos: any): Promise<void> {
  await guardarMotocicleta(userId, datos)
}

export async function agregarMantenimiento(userId: string, datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('mantenimientos')
    .insert({ user_id: userId, ...datos })
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
  const { error } = await supabase
    .from('contactos_emergencia')
    .insert({ user_id: userId, ...datos })
  if (error) throw error
}

export async function obtenerContactosEmergencia(userId: string): Promise<any[]> {
  const { data } = await supabase
    .from('contactos_emergencia')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return (data || []).map((c: any) => ({
    ...c,
    nombreCompleto: c.nombre_completo,
    autorizadoNotificaciones: c.autorizado_notificaciones,
    esContactoPrincipal: c.es_contacto_principal,
  }))
}

export async function actualizarContactoEmergencia(id: string, datos: any): Promise<void> {
  const { error } = await supabase
    .from('contactos_emergencia')
    .update(datos)
    .eq('id', id)
  if (error) throw error
}

export async function eliminarContactoEmergencia(id: string): Promise<void> {
  await supabase.from('contactos_emergencia').delete().eq('id', id)
}

// ── Info médica ─────────────────────────────────────────────

export async function guardarInfoMedica(userId: string, datos: any): Promise<void> {
  const { error } = await supabase
    .from('info_medica')
    .upsert({ user_id: userId, ...datos, updated_at: new Date() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function obtenerInfoMedica(userId: string): Promise<any> {
  const { data } = await supabase
    .from('info_medica')
    .select('*')
    .eq('user_id', userId)
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

  const [{ data: perfil }, { data: moto }, { data: contactos }, { data: medica }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('user_id', userId).single(),
    supabase.from('motocicletas').select('*').eq('user_id', userId).single(),
    supabase.from('contactos_emergencia').select('*').eq('user_id', userId),
    supabase.from('info_medica').select('*').eq('user_id', userId).single(),
  ])

  if (!perfil || !perfil.qr_activo) return null

  return {
    userId,
    nombres: perfil.nombres,
    apellidos: perfil.apellidos,
    fotoPerfil: perfil.foto_perfil,
    ciudad: perfil.ciudad,
    moto: moto ? {
      placa: moto.placa,
      marca: moto.marca,
      modelo: moto.modelo,
      color: moto.color,
    } : undefined,
    contactosEmergencia: (contactos || []).map((c: any) => ({
      id: c.id,
      nombreCompleto: c.nombre_completo,
      parentesco: c.parentesco,
      celular: c.celular,
    })),
    infoMedica: medica ? {
      grupoSanguineo: medica.grupo_sanguineo,
      eps: medica.eps,
      alergias: medica.alergias,
      condicionesMedicas: medica.condiciones_medicas,
      medicamentos: medica.medicamentos,
      observaciones: medica.observaciones,
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
  let query = supabase
    .from('reportes_emergencia')
    .select('*')
    .order('created_at', { ascending: false })
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
    .from('alertas_viales')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending: false })
  return data || []
}

export async function crearAlertaVial(datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('alertas_viales')
    .insert(datos)
    .select('id')
    .single()
  if (error) throw error
  return data?.id
}

export async function actualizarVotoAlerta(id: string, tipo: string): Promise<void> {
  const campo = tipo === 'util' ? 'votos_util' : 'votos_no_util'
  await supabase.rpc('incrementar_voto', { alerta_id: id, campo_voto: campo })
}

export async function obtenerTodasAlertas(): Promise<any[]> {
  const { data } = await supabase
    .from('alertas_viales')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function verificarAlerta(id: string, verificado: boolean): Promise<void> {
  await supabase.from('alertas_viales').update({ verificada: verificado }).eq('id', id)
}

// ── Establecimientos ────────────────────────────────────────

export async function obtenerEstablecimientos(): Promise<any[]> {
  const { data } = await supabase
    .from('establecimientos')
    .select('*')
    .order('nombre', { ascending: true })
  return data || []
}

export async function obtenerTodosEstablecimientos(): Promise<any[]> {
  return obtenerEstablecimientos()
}

export async function crearEstablecimiento(datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('establecimientos')
    .insert(datos)
    .select('id')
    .single()
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
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function actualizarEstadoUsuario(id: string, activo: boolean): Promise<void> {
  await supabase.from('usuarios').update({ is_active: activo }).eq('id', id)
}

// ── Comunidad ───────────────────────────────────────────────

export async function obtenerClubes(): Promise<any[]> {
  return []
}

export async function obtenerEventos(): Promise<any[]> {
  return []
}

export async function crearClub(datos: any): Promise<string> {
  return `club-${Date.now()}`
}

export async function crearEvento(datos: any): Promise<string> {
  return `evento-${Date.now()}`
}

export async function unirseAClub(clubId: string, userId: string): Promise<void> {}
export async function salirDeClub(clubId: string, userId: string): Promise<void> {}

// ── Solicitudes de ambulancia (tiempo real) ─────────────────

export async function crearSolicitudAmbulancia(datos: any): Promise<string> {
  const { data, error } = await supabase
    .from('solicitudes_ambulancia')
    .insert(datos)
    .select('id')
    .single()
  if (error) throw error
  return data?.id
}

export async function obtenerSolicitudesPendientes(): Promise<any[]> {
  const { data } = await supabase
    .from('solicitudes_ambulancia')
    .select('*')
    .eq('estado', 'PENDIENTE')
    .order('created_at', { ascending: false })
  return data || []
}

export async function aceptarSolicitudAmbulancia(solicitudId: string, conductorId: string): Promise<void> {
  await supabase
    .from('solicitudes_ambulancia')
    .update({
      estado: 'ACEPTADA',
      conductor_id: conductorId,
      aceptada_at: new Date(),
    })
    .eq('id', solicitudId)
}

export async function completarSolicitudAmbulancia(solicitudId: string): Promise<void> {
  await supabase
    .from('solicitudes_ambulancia')
    .update({ estado: 'COMPLETADA', completada_at: new Date() })
    .eq('id', solicitudId)
}
