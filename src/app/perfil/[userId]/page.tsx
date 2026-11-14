import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { obtenerPerfilPublicoPorQR } from '@/lib/firestore'
import PerfilPublicoView from '@/components/profile/PerfilPublicoView'

interface Props {
  params: { userId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const perfil = await obtenerPerfilPublicoPorQR(params.userId)
  if (!perfil) return { title: 'Perfil no encontrado - MotoSafe' }
  return {
    title: `${perfil.nombres} ${perfil.apellidos} - MotoSafe`,
    description: `Perfil de emergencia de ${perfil.nombres} ${perfil.apellidos} en MotoSafe.`,
  }
}

export default async function PerfilPublicoPage({ params }: Props) {
  const perfil = await obtenerPerfilPublicoPorQR(params.userId)
  if (!perfil || !perfil.qrActivo) return notFound()
  return <PerfilPublicoView perfil={perfil} userId={params.userId} />
}
