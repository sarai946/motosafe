'use client'
import React, { useEffect, useRef } from 'react'

// Iconos por categoría
const ICONOS: Record<string, string> = {
  GASOLINERA:        '⛽',
  TALLER:            '🔧',
  MONTALLANTAS:      '🔄',
  REPUESTOS:         '⚙️',
  GRUA:              '🚛',
  PARQUEADERO:       '🅿️',
  CENTRO_ASISTENCIA: '🏥',
  AMBULANCIA:        '🚑',
}

const COLORES: Record<string, string> = {
  GASOLINERA:        '#eab308',
  TALLER:            '#3b82f6',
  MONTALLANTAS:      '#22c55e',
  REPUESTOS:         '#a855f7',
  GRUA:              '#f97316',
  PARQUEADERO:       '#06b6d4',
  CENTRO_ASISTENCIA: '#ef4444',
  AMBULANCIA:        '#dc2626',
}

interface Props {
  ubicacion: { lat: number; lng: number }
  establecimientos: any[]
  seleccionado: any
  onSeleccionar: (est: any) => void
}

export default function MapaLeaflet({ ubicacion, establecimientos, seleccionado, onSeleccionar }: Props) {
  const mapRef   = useRef<any>(null)
  const divRef   = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)

  // Inicializar mapa
  useEffect(() => {
    if (typeof window === 'undefined' || !divRef.current) return
    if (mapRef.current) return // ya inicializado

    const L = require('leaflet')

    // Fix para el icono por defecto de Leaflet en Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Crear mapa centrado en la ubicación del usuario
    const map = L.map(divRef.current, {
      center: [ubicacion.lat, ubicacion.lng],
      zoom: 14,
      zoomControl: true,
    })

    // Capa de tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Marcador de la ubicación del usuario (punto azul)
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:16px;height:16px;
        background:#3b82f6;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 0 3px rgba(59,130,246,0.4);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    userMarkerRef.current = L.marker([ubicacion.lat, ubicacion.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Tu ubicación</b>')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // solo una vez

  // Actualizar marcador de usuario si cambia ubicación
  useEffect(() => {
    if (!mapRef.current || !userMarkerRef.current) return
    userMarkerRef.current.setLatLng([ubicacion.lat, ubicacion.lng])
  }, [ubicacion])

  // Actualizar marcadores de establecimientos
  useEffect(() => {
    if (!mapRef.current) return
    const L = require('leaflet')

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Agregar marcador por cada establecimiento con coordenadas
    establecimientos.forEach(est => {
      if (!est.lat || !est.lng) return

      const emoji  = ICONOS[est.tipo] || '📍'
      const color  = COLORES[est.tipo] || '#6b7280'
      const activo = seleccionado?.id === est.id

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:${activo ? 44 : 36}px;
          height:${activo ? 44 : 36}px;
          background:${color};
          border:${activo ? '3px' : '2px'} solid white;
          border-radius:50%;
          font-size:${activo ? '20px' : '16px'};
          box-shadow:0 2px 8px rgba(0,0,0,0.4)${activo ? ',0 0 0 4px ' + color + '55' : ''};
          transition:all 0.2s;
          cursor:pointer;
        ">${emoji}</div>`,
        iconSize: [activo ? 44 : 36, activo ? 44 : 36],
        iconAnchor: [activo ? 22 : 18, activo ? 22 : 18],
        popupAnchor: [0, activo ? -24 : -20],
      })

      const marker = L.marker([est.lat, est.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;">
            <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${emoji} ${est.nombre}</div>
            <div style="color:#666;font-size:12px;">${est.ciudad || ''}${est.localidad ? ' · ' + est.localidad : ''}</div>
            ${est.direccion ? `<div style="color:#666;font-size:12px;margin-top:2px;">📍 ${est.direccion}</div>` : ''}
            ${est.distancia != null ? `<div style="color:#3b82f6;font-size:12px;font-weight:bold;margin-top:4px;">📍 ${est.distancia.toFixed(1)} km</div>` : ''}
            ${est.horarios ? `<div style="color:#666;font-size:11px;margin-top:2px;">🕐 ${est.horarios}</div>` : ''}
          </div>
        `, { maxWidth: 220 })
        .on('click', () => onSeleccionar(est))

      markersRef.current.push(marker)
    })
  }, [establecimientos, seleccionado])

  // Centrar mapa en el establecimiento seleccionado
  useEffect(() => {
    if (!mapRef.current || !seleccionado?.lat || !seleccionado?.lng) return
    mapRef.current.setView([seleccionado.lat, seleccionado.lng], 16, { animate: true })
    // Abrir popup del marcador seleccionado
    const marker = markersRef.current.find((_, i) => establecimientos[i]?.id === seleccionado.id)
    marker?.openPopup()
  }, [seleccionado])

  return (
    <>
      {/* CSS de Leaflet */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={divRef} style={{ width: '100%', height: '100%', minHeight: 300 }} />
    </>
  )
}
