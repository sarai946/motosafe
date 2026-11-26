-- ============================================================
-- MOTOSAFE – Centrales de Ambulancia
-- Ejecutar en Supabase → Editor SQL
-- ============================================================

-- ── 1. Tabla de centrales de ambulancia ─────────────────────
CREATE TABLE IF NOT EXISTS centrales_ambulancia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identidad
  nombre          TEXT NOT NULL,
  nit             TEXT,
  representante   TEXT NOT NULL,
  -- Contacto
  email           TEXT NOT NULL UNIQUE,
  celular         TEXT NOT NULL,
  whatsapp        TEXT,
  -- Operación
  ciudad          TEXT NOT NULL,
  departamento    TEXT,
  direccion       TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  -- Flota
  total_ambulancias   INTEGER DEFAULT 1,
  ambulancias_activas INTEGER DEFAULT 0,
  tipos_ambulancia    TEXT[],       -- ['BASICA','MEDICALIZADA','NEONATAL']
  -- Habilitación legal
  numero_habilitacion TEXT NOT NULL,
  -- Estado
  estado          TEXT DEFAULT 'INACTIVO'
                    CHECK (estado IN ('ACTIVO','OCUPADO','INACTIVO')),
  verificada      BOOLEAN DEFAULT false,
  activa          BOOLEAN DEFAULT false,
  -- Estadísticas
  total_servicios INTEGER DEFAULT 0,
  calificacion    DECIMAL(3,2) DEFAULT 5.0,
  -- Credenciales generadas por el admin
  password_temporal TEXT,          -- se muestra solo una vez al crear
  -- Auditoría
  creada_por      UUID,            -- auth_id del admin que la creó
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Actualizar solicitudes_ambulancia para referenciar central ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='solicitudes_ambulancia' AND column_name='central_id')
  THEN
    ALTER TABLE solicitudes_ambulancia ADD COLUMN central_id UUID REFERENCES centrales_ambulancia(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='solicitudes_ambulancia' AND column_name='descripcion')
  THEN
    ALTER TABLE solicitudes_ambulancia ADD COLUMN descripcion TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='solicitudes_ambulancia' AND column_name='tiempo_respuesta_min')
  THEN
    ALTER TABLE solicitudes_ambulancia ADD COLUMN tiempo_respuesta_min INTEGER;
  END IF;
END $$;

-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE centrales_ambulancia ENABLE ROW LEVEL SECURITY;

-- Lectura pública de centrales verificadas y activas
CREATE POLICY "centrales_lectura_publica"
  ON centrales_ambulancia FOR SELECT
  USING (verificada = true AND activa = true);

-- La central puede leer su propio registro usando su email
CREATE POLICY "central_lectura_propia"
  ON centrales_ambulancia FOR SELECT
  USING (
    email = (SELECT email FROM usuarios WHERE auth_id = auth.uid() LIMIT 1)
  );

-- La central puede actualizar su propio estado
CREATE POLICY "central_update_propia"
  ON centrales_ambulancia FOR UPDATE
  USING (
    email = (SELECT email FROM usuarios WHERE auth_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    email = (SELECT email FROM usuarios WHERE auth_id = auth.uid() LIMIT 1)
  );

-- Solo admins pueden crear, verificar y eliminar centrales
CREATE POLICY "centrales_admin_all"
  ON centrales_ambulancia FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role IN ('admin','superadmin') AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND role IN ('admin','superadmin') AND is_active = true)
  );

-- Habilitar realtime para solicitudes y centrales
ALTER PUBLICATION supabase_realtime ADD TABLE centrales_ambulancia;
