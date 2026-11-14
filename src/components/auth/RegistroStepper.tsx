'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Bike, Phone, Heart, CheckSquare,
  ChevronRight, ChevronLeft, Check, Eye, EyeOff,
  Plus, Trash2
} from 'lucide-react'
import { registrarUsuario } from '@/lib/auth'
import { guardarPerfil, guardarMotocicleta, guardarContactoEmergencia, guardarInfoMedica } from '@/lib/firestore'
import { inicializarQR } from '@/lib/qr'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ---- Esquemas de validación por paso ----
const paso1Schema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  tipoDocumento: z.enum(['CC', 'CE', 'PA', 'TI', 'OTRO']),
  numeroDocumento: z.string().min(5, 'Documento inválido'),
  celular: z.string().min(10, 'Número inválido').max(15),
  email: z.string().email('Correo inválido'),
  ciudad: z.string().min(2, 'Ingresa tu ciudad'),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarContrasena: z.string(),
}).refine(d => d.contrasena === d.confirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarContrasena'],
})

const paso2Schema = z.object({
  placa: z.string().min(5, 'Placa inválida').max(8),
  marca: z.string().min(2, 'Ingresa la marca'),
  modelo: z.string().min(2, 'Ingresa el modelo'),
  cilindraje: z.string().min(1, 'Ingresa el cilindraje'),
  color: z.string().min(2, 'Ingresa el color'),
  anio: z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
})

type Paso1Data = z.infer<typeof paso1Schema>
type Paso2Data = z.infer<typeof paso2Schema>

interface ContactoForm {
  nombreCompleto: string
  parentesco: string
  celular: string
  autorizadoNotificaciones: boolean
}

const PASOS = [
  { numero: 1, titulo: 'Datos personales', icono: User },
  { numero: 2, titulo: 'Mi motocicleta', icono: Bike },
  { numero: 3, titulo: 'Contactos', icono: Phone },
  { numero: 4, titulo: 'Info médica', icono: Heart },
  { numero: 5, titulo: 'Confirmar', icono: CheckSquare },
]

export default function RegistroStepper() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [verPass, setVerPass] = useState(false)
  const [verPass2, setVerPass2] = useState(false)

  // Datos acumulados
  const [datosPaso1, setDatosPaso1] = useState<Paso1Data | null>(null)
  const [datosPaso2, setDatosPaso2] = useState<Paso2Data | null>(null)
  const [contactos, setContactos] = useState<ContactoForm[]>([
    { nombreCompleto: '', parentesco: '', celular: '', autorizadoNotificaciones: true },
  ])
  const [infoMedica, setInfoMedica] = useState({
    grupoSanguineo: '',
    alergias: '',
    condicionesMedicas: '',
    medicamentos: '',
    observaciones: '',
    mostrarEnEmergencia: true,
  })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [autorizaDatos, setAutorizaDatos] = useState(false)

  // Forms
  const form1 = useForm<Paso1Data>({ resolver: zodResolver(paso1Schema) })
  const form2 = useForm<Paso2Data>({ resolver: zodResolver(paso2Schema) })

  // ---- Avanzar pasos ----
  const avanzarPaso1 = form1.handleSubmit((data) => {
    setDatosPaso1(data)
    setPasoActual(2)
  })

  const avanzarPaso2 = form2.handleSubmit((data) => {
    setDatosPaso2(data)
    setPasoActual(3)
  })

  // ---- Contactos ----
  const agregarContacto = () => {
    setContactos([...contactos, { nombreCompleto: '', parentesco: '', celular: '', autorizadoNotificaciones: true }])
  }
  const eliminarContacto = (i: number) => setContactos(contactos.filter((_, idx) => idx !== i))
  const actualizarContacto = (i: number, campo: keyof ContactoForm, valor: string | boolean) => {
    const nuevo = [...contactos]
    nuevo[i] = { ...nuevo[i], [campo]: valor }
    setContactos(nuevo)
  }

  // ---- Registro final ----
  const finalizarRegistro = async () => {
    if (!datosPaso1 || !datosPaso2) return
    if (!aceptaTerminos || !autorizaDatos) {
      toast.error('Debes aceptar los términos y autorizar el tratamiento de datos')
      return
    }

    setCargando(true)
    try {
      // 1. Crear usuario en Firebase Auth
      const user = await registrarUsuario(
        datosPaso1.email,
        datosPaso1.contrasena,
        `${datosPaso1.nombres} ${datosPaso1.apellidos}`
      )

      // 2. Inicializar QR
      await inicializarQR(user.uid)

      // 3. Guardar perfil
      await guardarPerfil(user.uid, {
        id: user.uid,
        userId: user.uid,
        nombres: datosPaso1.nombres,
        apellidos: datosPaso1.apellidos,
        tipoDocumento: datosPaso1.tipoDocumento,
        numeroDocumento: datosPaso1.numeroDocumento,
        celular: datosPaso1.celular,
        email: datosPaso1.email,
        ciudad: datosPaso1.ciudad,
        pais: 'Colombia',
        qrCode: user.uid,
        qrActivo: true,
        isActive: true,
        profilePublico: {
          mostrarNombre: true,
          mostrarCelular: false,
          mostrarEmail: false,
          mostrarCiudad: true,
          mostrarPlacaMoto: true,
          mostrarFotoMoto: true,
          mostrarContactosEmergencia: true,
          mostrarInfoMedica: infoMedica.mostrarEnEmergencia,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 4. Guardar motocicleta
      await guardarMotocicleta(user.uid, {
        userId: user.uid,
        placa: datosPaso2.placa.toUpperCase(),
        marca: datosPaso2.marca,
        modelo: datosPaso2.modelo,
        cilindraje: datosPaso2.cilindraje,
        color: datosPaso2.color,
        anio: datosPaso2.anio,
      })

      // 5. Guardar contactos de emergencia
      for (const contacto of contactos) {
        if (contacto.nombreCompleto && contacto.celular) {
          await guardarContactoEmergencia(user.uid, {
            nombreCompleto: contacto.nombreCompleto,
            parentesco: contacto.parentesco,
            celular: contacto.celular,
            autorizadoNotificaciones: contacto.autorizadoNotificaciones,
            esContactoPrincipal: contactos.indexOf(contacto) === 0,
          })
        }
      }

      // 6. Guardar info médica (si se proporcionó)
      if (infoMedica.grupoSanguineo || infoMedica.alergias || infoMedica.observaciones) {
        await guardarInfoMedica(user.uid, {
          userId: user.uid,
          grupoSanguineo: infoMedica.grupoSanguineo || undefined,
          alergias: infoMedica.alergias || undefined,
          condicionesMedicas: infoMedica.condicionesMedicas || undefined,
          medicamentos: infoMedica.medicamentos || undefined,
          observaciones: infoMedica.observaciones || undefined,
          mostrarEnEmergencia: infoMedica.mostrarEnEmergencia,
          id: user.uid,
        })
      }

      // 7. Registro completado
      toast.success('¡Registro exitoso! Bienvenido a MotoSafe 🏍️')
      router.push('/dashboard')
    } catch (error: any) {
      const msg = error.code === 'auth/email-already-in-use'
        ? 'Ya existe una cuenta con ese correo'
        : 'Error en el registro. Intenta de nuevo.'
      toast.error(msg)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      {/* Stepper */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {PASOS.map((paso, index) => (
            <React.Fragment key={paso.numero}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  pasoActual > paso.numero
                    ? 'bg-accent-500 border-accent-500 text-white'
                    : pasoActual === paso.numero
                      ? 'bg-primary-500 border-primary-500 text-white shadow-glow-blue'
                      : 'bg-dark-700 border-white/20 text-white/30'
                )}>
                  {pasoActual > paso.numero ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <paso.icono className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium hidden sm:block',
                  pasoActual === paso.numero ? 'text-primary-400' : 'text-white/30'
                )}>
                  {paso.titulo}
                </span>
              </div>
              {index < PASOS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors duration-300',
                  pasoActual > paso.numero ? 'bg-accent-500' : 'bg-white/10'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* ===================== PASO 1: Datos personales ===================== */}
        {pasoActual === 1 && (
          <div className="card animate-fade-in">
            <h2 className="text-white font-display font-bold text-xl mb-1">Datos personales</h2>
            <p className="text-white/40 text-sm mb-6">Esta información se usará para tu perfil de emergencia</p>
            <form onSubmit={avanzarPaso1} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Nombres *</label>
                  <input {...form1.register('nombres')} className="input-field" placeholder="Carlos" />
                  {form1.formState.errors.nombres && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.nombres.message}</p>}
                </div>
                <div>
                  <label className="input-label">Apellidos *</label>
                  <input {...form1.register('apellidos')} className="input-field" placeholder="Rodríguez" />
                  {form1.formState.errors.apellidos && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.apellidos.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tipo de documento *</label>
                  <select {...form1.register('tipoDocumento')} className="input-field">
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="CE">Cédula de extranjería</option>
                    <option value="PA">Pasaporte</option>
                    <option value="TI">Tarjeta de identidad</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Número de documento *</label>
                  <input {...form1.register('numeroDocumento')} className="input-field" placeholder="1234567890" />
                  {form1.formState.errors.numeroDocumento && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.numeroDocumento.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Celular *</label>
                  <input {...form1.register('celular')} className="input-field" placeholder="3001234567" type="tel" />
                  {form1.formState.errors.celular && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.celular.message}</p>}
                </div>
                <div>
                  <label className="input-label">Ciudad *</label>
                  <input {...form1.register('ciudad')} className="input-field" placeholder="Bogotá" />
                  {form1.formState.errors.ciudad && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.ciudad.message}</p>}
                </div>
              </div>

              <div>
                <label className="input-label">Correo electrónico *</label>
                <input {...form1.register('email')} type="email" className="input-field" placeholder="tu@correo.com" />
                {form1.formState.errors.email && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Contraseña *</label>
                  <div className="relative">
                    <input {...form1.register('contrasena')} type={verPass ? 'text' : 'password'} className="input-field pr-10" placeholder="Mínimo 8 caracteres" />
                    <button type="button" onClick={() => setVerPass(!verPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                      {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form1.formState.errors.contrasena && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.contrasena.message}</p>}
                </div>
                <div>
                  <label className="input-label">Confirmar contraseña *</label>
                  <div className="relative">
                    <input {...form1.register('confirmarContrasena')} type={verPass2 ? 'text' : 'password'} className="input-field pr-10" placeholder="Repite la contraseña" />
                    <button type="button" onClick={() => setVerPass2(!verPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                      {verPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form1.formState.errors.confirmarContrasena && <p className="text-red-400 text-xs mt-1">{form1.formState.errors.confirmarContrasena.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================== PASO 2: Motocicleta ===================== */}
        {pasoActual === 2 && (
          <div className="card animate-fade-in">
            <h2 className="text-white font-display font-bold text-xl mb-1">Mi motocicleta</h2>
            <p className="text-white/40 text-sm mb-6">Registra los datos de tu moto para identificación</p>
            <form onSubmit={avanzarPaso2} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Placa *</label>
                  <input {...form2.register('placa')} className="input-field uppercase" placeholder="ABC123" />
                  {form2.formState.errors.placa && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.placa.message}</p>}
                </div>
                <div>
                  <label className="input-label">Año *</label>
                  <input {...form2.register('anio')} type="number" className="input-field" placeholder="2022" />
                  {form2.formState.errors.anio && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.anio.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Marca *</label>
                  <input {...form2.register('marca')} className="input-field" placeholder="Honda" />
                  {form2.formState.errors.marca && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.marca.message}</p>}
                </div>
                <div>
                  <label className="input-label">Modelo *</label>
                  <input {...form2.register('modelo')} className="input-field" placeholder="CB 500F" />
                  {form2.formState.errors.modelo && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.modelo.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Cilindraje *</label>
                  <input {...form2.register('cilindraje')} className="input-field" placeholder="500cc" />
                  {form2.formState.errors.cilindraje && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.cilindraje.message}</p>}
                </div>
                <div>
                  <label className="input-label">Color *</label>
                  <input {...form2.register('color')} className="input-field" placeholder="Rojo" />
                  {form2.formState.errors.color && <p className="text-red-400 text-xs mt-1">{form2.formState.errors.color.message}</p>}
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setPasoActual(1)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================== PASO 3: Contactos ===================== */}
        {pasoActual === 3 && (
          <div className="card animate-fade-in">
            <h2 className="text-white font-display font-bold text-xl mb-1">Contactos de emergencia</h2>
            <p className="text-white/40 text-sm mb-6">Personas a quienes notificar en caso de emergencia</p>
            <div className="space-y-4">
              {contactos.map((contacto, i) => (
                <div key={i} className="p-4 bg-dark-700 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm font-medium">Contacto {i + 1}</span>
                    {i > 0 && (
                      <button onClick={() => eliminarContacto(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label text-xs">Nombre completo *</label>
                      <input
                        value={contacto.nombreCompleto}
                        onChange={e => actualizarContacto(i, 'nombreCompleto', e.target.value)}
                        className="input-field text-sm py-2"
                        placeholder="María García"
                      />
                    </div>
                    <div>
                      <label className="input-label text-xs">Parentesco</label>
                      <input
                        value={contacto.parentesco}
                        onChange={e => actualizarContacto(i, 'parentesco', e.target.value)}
                        className="input-field text-sm py-2"
                        placeholder="Mamá, esposo/a..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label text-xs">Celular *</label>
                    <input
                      value={contacto.celular}
                      onChange={e => actualizarContacto(i, 'celular', e.target.value)}
                      className="input-field text-sm py-2"
                      placeholder="3001234567"
                      type="tel"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contacto.autorizadoNotificaciones}
                      onChange={e => actualizarContacto(i, 'autorizadoNotificaciones', e.target.checked)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    <span className="text-white/60 text-xs">Autorizado para recibir notificaciones de emergencia</span>
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={agregarContacto}
                className="w-full border-2 border-dashed border-white/20 hover:border-primary-500/50 rounded-xl py-3 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Agregar otro contacto
              </button>

              <div className="flex justify-between pt-2">
                <button onClick={() => setPasoActual(2)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button onClick={() => setPasoActual(4)} className="btn-primary flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PASO 4: Info médica ===================== */}
        {pasoActual === 4 && (
          <div className="card animate-fade-in">
            <h2 className="text-white font-display font-bold text-xl mb-1">Información médica</h2>
            <p className="text-white/40 text-sm mb-1">Opcional — puede ser crítica en una emergencia</p>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-5">
              <p className="text-yellow-300 text-xs">⚠️ Esta información es voluntaria. Solo se mostrará si tú lo autorizas.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Grupo sanguíneo</label>
                  <select
                    value={infoMedica.grupoSanguineo}
                    onChange={e => setInfoMedica({ ...infoMedica, grupoSanguineo: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Seleccionar...</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Alergias</label>
                <textarea
                  value={infoMedica.alergias}
                  onChange={e => setInfoMedica({ ...infoMedica, alergias: e.target.value })}
                  className="input-field resize-none h-20"
                  placeholder="Penicilina, mariscos, látex..."
                />
              </div>
              <div>
                <label className="input-label">Condiciones médicas relevantes</label>
                <textarea
                  value={infoMedica.condicionesMedicas}
                  onChange={e => setInfoMedica({ ...infoMedica, condicionesMedicas: e.target.value })}
                  className="input-field resize-none h-20"
                  placeholder="Diabetes, hipertensión..."
                />
              </div>
              <div>
                <label className="input-label">Observaciones importantes</label>
                <textarea
                  value={infoMedica.observaciones}
                  onChange={e => setInfoMedica({ ...infoMedica, observaciones: e.target.value })}
                  className="input-field resize-none h-20"
                  placeholder="Información relevante para paramédicos..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={infoMedica.mostrarEnEmergencia}
                  onChange={e => setInfoMedica({ ...infoMedica, mostrarEnEmergencia: e.target.checked })}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-white/60 text-sm">Mostrar esta información al escanear mi QR en emergencias</span>
              </label>
              <div className="flex justify-between pt-2">
                <button onClick={() => setPasoActual(3)} className="btn-secondary flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button onClick={() => setPasoActual(5)} className="btn-primary flex items-center gap-2">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PASO 5: Confirmar ===================== */}
        {pasoActual === 5 && (
          <div className="card animate-fade-in space-y-5">
            <h2 className="text-white font-display font-bold text-xl mb-1">Confirmar registro</h2>
            <p className="text-white/40 text-sm">Revisa tu información antes de crear la cuenta</p>

            {/* Resumen */}
            {datosPaso1 && (
              <div className="p-4 bg-dark-700 border border-white/10 rounded-xl">
                <h3 className="text-white/60 text-xs font-semibold uppercase mb-2">Datos personales</h3>
                <p className="text-white font-medium">{datosPaso1.nombres} {datosPaso1.apellidos}</p>
                <p className="text-white/50 text-sm">{datosPaso1.email} · {datosPaso1.celular}</p>
                <p className="text-white/50 text-sm">{datosPaso1.ciudad}, Colombia</p>
              </div>
            )}
            {datosPaso2 && (
              <div className="p-4 bg-dark-700 border border-white/10 rounded-xl">
                <h3 className="text-white/60 text-xs font-semibold uppercase mb-2">Motocicleta</h3>
                <p className="text-white font-medium">{datosPaso2.marca} {datosPaso2.modelo} {datosPaso2.anio}</p>
                <p className="text-white/50 text-sm">Placa: <strong className="text-accent-400">{datosPaso2.placa.toUpperCase()}</strong> · {datosPaso2.color} · {datosPaso2.cilindraje}</p>
              </div>
            )}

            {/* Términos y condiciones */}
            <div className="space-y-3 p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary-500 shrink-0"
                />
                <span className="text-white/70 text-sm">
                  He leído y acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-primary-400 underline">términos y condiciones</a>
                  {' '}de MotoSafe *
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autorizaDatos}
                  onChange={e => setAutorizaDatos(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary-500 shrink-0"
                />
                <span className="text-white/70 text-sm">
                  Autorizo el tratamiento de mis datos personales según la{' '}
                  <a href="/tratamiento-datos" target="_blank" className="text-primary-400 underline">Ley 1581 de 2012</a>
                  {' '}y la{' '}
                  <a href="/privacidad" target="_blank" className="text-primary-400 underline">política de privacidad</a>
                  {' '}de MotoSafe *
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setPasoActual(4)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={finalizarRegistro}
                disabled={cargando || !aceptaTerminos || !autorizaDatos}
                className="btn-success flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? 'Creando cuenta...' : '🏍️ Crear mi cuenta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
