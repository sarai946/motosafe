'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, CheckCircle, XCircle, Mail, MapPin, Calendar } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerTodosUsuarios, actualizarEstadoUsuario } from '@/lib/firestore'
import type { User } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsuariosPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [cargando, setCargando]  = useState(true)
  const [busqueda, setBusqueda]  = useState('')
  const [filtro, setFiltro]      = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS' | 'ADMIN'>('TODOS')

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  useEffect(() => {
    if (!esAdmin) return
    obtenerTodosUsuarios().then(u => { setUsuarios(u); setCargando(false) })
  }, [esAdmin])

  const toggleEstado = async (u: User) => {
    await actualizarEstadoUsuario(u.uid, !u.isActive)
    setUsuarios(prev => prev.map(x => x.uid === u.uid ? { ...x, isActive: !x.isActive } : x))
    toast.success(u.isActive ? 'Usuario desactivado' : 'Usuario activado')
  }

  const filtrados = usuarios.filter(u => {
    const matchBusq = busqueda === '' ||
      u.displayName?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
    const matchFiltro =
      filtro === 'TODOS' ||
      (filtro === 'ACTIVOS' && u.isActive) ||
      (filtro === 'INACTIVOS' && !u.isActive) ||
      (filtro === 'ADMIN' && (u.role === 'admin' || u.role === 'superadmin'))
    return matchBusq && matchFiltro
  })

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.isActive).length,
    inactivos: usuarios.filter(u => !u.isActive).length,
    admins: usuarios.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
  }

  const formatFecha = (val: any): string => {
    if (!val) return '—'
    if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('es-CO')
    if (val instanceof Date) return val.toLocaleDateString('es-CO')
    return '—'
  }

  if (authCargando || !esAdmin) return null

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-400" /> Usuarios
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Gestión de cuentas registradas</p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Activos', value: stats.activos, color: 'text-accent-400' },
            { label: 'Inactivos', value: stats.inactivos, color: 'text-red-400' },
            { label: 'Admins', value: stats.admins, color: 'text-primary-400' },
          ].map(s => (
            <div key={s.label} className="card border border-white/10 text-center py-3">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{cargando ? '—' : s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Búsqueda + filtro */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" placeholder="Buscar por nombre o email..." />
          </div>
          <select value={filtro} onChange={e => setFiltro(e.target.value as any)}
            className="input-field sm:w-40">
            <option value="TODOS">Todos</option>
            <option value="ACTIVOS">Activos</option>
            <option value="INACTIVOS">Inactivos</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(u => (
              <div key={u.uid} className={cn(
                'card border transition-colors',
                u.isActive ? 'border-white/10 hover:border-primary-500/20' : 'border-red-500/10 bg-red-500/5'
              )}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0',
                    u.role === 'admin' || u.role === 'superadmin' ? 'bg-primary-500' : 'bg-dark-600'
                  )}>
                    {u.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm truncate">{u.displayName || '(sin nombre)'}</span>
                      <span className={cn(
                        'badge shrink-0',
                        u.role === 'admin' || u.role === 'superadmin'
                          ? 'bg-primary-500/20 text-primary-300 border border-primary-500/20'
                          : 'bg-dark-600 text-white/30 border border-white/10'
                      )}>
                        {u.role === 'superadmin' ? '👑 Superadmin' : u.role === 'admin' ? '🛡 Admin' : 'Usuario'}
                      </span>
                      {!u.isActive && (
                        <span className="badge bg-red-500/20 text-red-300 border border-red-500/20 shrink-0">Inactivo</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {u.email && (
                        <span className="text-white/40 text-xs flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {u.email}
                        </span>
                      )}
                      <span className="text-white/20 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatFecha((u as any).createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Acción */}
                  {u.role !== 'superadmin' && (
                    <button
                      onClick={() => toggleEstado(u)}
                      title={u.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
                      className={cn(
                        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0',
                        u.isActive
                          ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                          : 'text-accent-400 border-accent-500/20 hover:bg-accent-500/10'
                      )}
                    >
                      {u.isActive
                        ? <><XCircle className="w-3 h-3" /> Desactivar</>
                        : <><CheckCircle className="w-3 h-3" /> Activar</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aviso de rol */}
        <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl">
          <p className="text-primary-300 text-sm font-medium mb-1">🔐 Cambiar rol a administrador</p>
          <p className="text-white/40 text-xs leading-relaxed">
            Para promover un usuario a admin, ve a Firebase Console → Firestore →{' '}
            colección <code className="bg-white/10 px-1 rounded">usuarios</code> → encuentra el documento del usuario
            y cambia el campo <code className="bg-white/10 px-1 rounded">role</code> a{' '}
            <code className="bg-white/10 px-1 rounded">admin</code>.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
