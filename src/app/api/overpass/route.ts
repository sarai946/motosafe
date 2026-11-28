import { NextRequest, NextResponse } from 'next/server'

// ── Endpoints de Overpass API con fallback ────────────────────
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
]

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query requerida' }, { status: 400 })

    let lastError: string = ''

    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(20000),
        })

        if (!res.ok) {
          lastError = `HTTP ${res.status} desde ${endpoint}`
          continue
        }

        const data = await res.json()
        return NextResponse.json(data)
      } catch (e: any) {
        lastError = e.message || 'Error de red'
        continue
      }
    }

    return NextResponse.json(
      { error: `Servicio no disponible: ${lastError}` },
      { status: 503 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
