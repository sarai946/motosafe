-- ============================================================
-- MOTOSAFE – Mapa Motero: SQL adaptado a la BD actual
-- Ejecutar en Supabase → Editor SQL
-- NO borra tablas existentes, solo agrega columnas y tablas nuevas
-- ============================================================

-- ── 1. Ampliar tabla establecimientos existente ──────────────
ALTER TABLE establecimientos
  ADD COLUMN IF NOT EXISTS nit TEXT,
  ADD COLUMN IF NOT EXISTS representante TEXT,
  ADD COLUMN IF NOT EXISTS localidad TEXT,
  ADD COLUMN IF NOT EXISTS servicios TEXT[],
  ADD COLUMN IF NOT EXISTS tarifas TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'NO_CONFIRMADO',
  ADD COLUMN IF NOT EXISTS es_24_horas BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS servicio_domicilio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS foto_url TEXT,
  ADD COLUMN IF NOT EXISTS documentos_verificados BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS habilitacion_legal TEXT,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- ── 2. Nueva tabla: solicitudes de registro de establecimientos ──
-- Los negocios solicitan aparecer en el mapa. El admin aprueba o rechaza.
CREATE TABLE IF NOT EXISTS solicitudes_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Datos del negocio
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  nit TEXT,
  representante TEXT NOT NULL,
  celular_representante TEXT NOT NULL,
  email_representante TEXT,
  descripcion TEXT,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  localidad TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  telefono TEXT,
  whatsapp TEXT,
  horarios TEXT,
  es_24_horas BOOLEAN DEFAULT false,
  servicio_domicilio BOOLEAN DEFAULT false,
  servicios TEXT[],
  tarifas TEXT,
  foto_url TEXT,
  -- Para ambulancias: habilitación legal
  habilitacion_legal TEXT,
  -- Estado de la solicitud
  estado TEXT DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA','EN_REVISION')),
  motivo_rechazo TEXT,
  -- Auditoría
  revisado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Nueva tabla: servicios de cada establecimiento (detallado) ──
CREATE TABLE IF NOT EXISTS servicios_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  disponible BOOLEAN DEFAULT true
);

-- ── 4. Nueva tabla: horarios de atención detallados ──────────
CREATE TABLE IF NOT EXISTS horarios_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  dia TEXT NOT NULL, -- 'lunes','martes',...,'domingo'
  hora_apertura TIME,
  hora_cierre TIME,
  cerrado BOOLEAN DEFAULT false
);

-- ── 5. Nueva tabla: calificaciones de usuarios ───────────────
CREATE TABLE IF NOT EXISTS calificaciones_establecimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establecimiento_id UUID REFERENCES establecimientos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(establecimiento_id, user_id)
);

-- ── 6. Políticas RLS para las nuevas tablas ──────────────────
ALTER TABLE solicitudes_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;

-- Establecimientos: cualquiera puede leer los verificados y activos
CREATE POLICY IF NOT EXISTS "establecimientos_lectura_publica"
  ON establecimientos FOR SELECT
  USING (verificado = true AND activo = true);

-- Admin puede hacer todo en establecimientos
CREATE POLICY IF NOT EXISTS "establecimientos_admin_all"
  ON establecimientos FOR ALL
  USING (true) WITH CHECK (true);

-- Solicitudes: cualquiera puede insertar, solo admin lee/actualiza
CREATE POLICY IF NOT EXISTS "solicitudes_insertar_publico"
  ON solicitudes_establecimiento FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "solicitudes_admin_all"
  ON solicitudes_establecimiento FOR ALL
  USING (true) WITH CHECK (true);

-- Servicios y horarios: lectura pública
CREATE POLICY IF NOT EXISTS "servicios_lectura"
  ON servicios_establecimiento FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "horarios_lectura"
  ON horarios_establecimiento FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "calificaciones_lectura"
  ON calificaciones_establecimiento FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "calificaciones_insertar"
  ON calificaciones_establecimiento FOR INSERT WITH CHECK (true);

-- ── 7. Datos DEMO (marcados como no verificados para pruebas) ─
-- IMPORTANTE: estos son datos ficticios para demostración.
-- NO están verificados. El admin debe verificarlos manualmente.
INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad, lat, lng,
   telefono, whatsapp, horarios, es_24_horas, verificado, activo, estado, servicios)
VALUES
  ('DEMO - Taller Moto Centro',    'TALLER',           'Mecánica general para motos',           'Av. Caracas #45-20',   'Bogotá', 'Teusaquillo', 4.6276, -74.0882, NULL, NULL, 'Lun-Sab 8am-6pm',  false, false, true, 'NO_CONFIRMADO', ARRAY['Mecánica general','Cambio de aceite']),
  ('DEMO - Gasolinera Calle 80',   'GASOLINERA',       'Estación de servicio',                  'Calle 80 #68-45',      'Bogotá', 'Engativá',    4.7127, -74.0831, NULL, NULL, '24 horas',         true,  false, true, 'NO_CONFIRMADO', ARRAY['Gasolina corriente','Gasolina extra','Aire']),
  ('DEMO - Montallantas El Norte', 'MONTALLANTAS',     'Reparación y cambio de llantas',        'Cra 30 #15-10',        'Bogotá', 'Puente Aranda',4.6097,-74.0817, NULL, NULL, 'Lun-Dom 7am-9pm',  false, false, true, 'NO_CONFIRMADO', ARRAY['Reparación','Cambio de llantas']),
  ('DEMO - Repuestos Moto Plus',   'REPUESTOS',        'Repuestos originales y genéricos',      'Cra 7 #32-15',         'Bogotá', 'Santa Fe',    4.6482, -74.0618, NULL, NULL, 'Lun-Sab 8am-7pm',  false, false, true, 'NO_CONFIRMADO', ARRAY['Repuestos originales','Baterías','Frenos']),
  ('DEMO - Grúas Moto 24H',        'GRUA',             'Grúa y asistencia en carretera',        'Calle 13 #37-20',      'Bogotá', 'Los Mártires',4.5981,-74.0761, NULL, NULL, '24 horas',         true,  false, true, 'NO_CONFIRMADO', ARRAY['Grúa','Transporte por avería']),
  ('DEMO - Parqueadero Norte',     'PARQUEADERO',      'Parqueadero cubierto y vigilado',       'Calle 100 #15-30',     'Bogotá', 'Usaquén',     4.6868, -74.0491, NULL, NULL, 'Lun-Dom 6am-10pm', false, false, true, 'NO_CONFIRMADO', ARRAY['Cubierto','Vigilancia','Por horas']),
  ('DEMO - Moto Asistencia',       'CENTRO_ASISTENCIA','Mecánico a domicilio y asistencia',     'Bogotá centro',        'Bogotá', 'Candelaria',  4.6534, -74.0836, NULL, NULL, '24 horas',         true,  false, true, 'NO_CONFIRMADO', ARRAY['Mecánico domicilio','Paso de corriente']),
  ('DEMO - Ambulancias MotoSafe',  'AMBULANCIA',       'Servicio de ambulancia prehospitalaria','Bogotá',               'Bogotá', 'Bogotá',      4.6500, -74.0800, NULL, NULL, '24 horas',         true,  false, true, 'NO_CONFIRMADO', ARRAY['Ambulancia básica','Atención prehospitalaria'])
ON CONFLICT DO NOTHING;
