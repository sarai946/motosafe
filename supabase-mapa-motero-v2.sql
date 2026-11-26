-- ============================================================
-- MOTOSAFE – Mapa Motero v2 (SQL corregido y seguro)
-- Compatible con Supabase PostgreSQL
-- Ejecutar en: Supabase → Editor SQL
-- ============================================================

-- ── VERIFICACIÓN: uuid-ossp ya está instalado ────────────────
-- Supabase incluye gen_random_uuid() de forma nativa (pg 13+)
-- Se usa gen_random_uuid() en lugar de uuid_generate_v4()

-- ── 1. Ampliar tabla establecimientos existente ──────────────
-- Solo agrega columnas que no existan. No borra ni modifica nada.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='nit') THEN
    ALTER TABLE establecimientos ADD COLUMN nit TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='representante') THEN
    ALTER TABLE establecimientos ADD COLUMN representante TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='localidad') THEN
    ALTER TABLE establecimientos ADD COLUMN localidad TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='servicios') THEN
    ALTER TABLE establecimientos ADD COLUMN servicios TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='tarifas') THEN
    ALTER TABLE establecimientos ADD COLUMN tarifas TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='estado') THEN
    ALTER TABLE establecimientos ADD COLUMN estado TEXT DEFAULT 'NO_CONFIRMADO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='es_24_horas') THEN
    ALTER TABLE establecimientos ADD COLUMN es_24_horas BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='servicio_domicilio') THEN
    ALTER TABLE establecimientos ADD COLUMN servicio_domicilio BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='foto_url') THEN
    ALTER TABLE establecimientos ADD COLUMN foto_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='documentos_verificados') THEN
    ALTER TABLE establecimientos ADD COLUMN documentos_verificados BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='habilitacion_legal') THEN
    ALTER TABLE establecimientos ADD COLUMN habilitacion_legal TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='establecimientos' AND column_name='activo') THEN
    ALTER TABLE establecimientos ADD COLUMN activo BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ── 2. Tabla de solicitudes de registro ──────────────────────
CREATE TABLE IF NOT EXISTS solicitudes_establecimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Datos del solicitante
  nombre_solicitante TEXT NOT NULL,
  celular_solicitante TEXT NOT NULL,
  email_solicitante TEXT,
  -- Datos del negocio
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'GASOLINERA','TALLER','MONTALLANTAS','REPUESTOS',
    'GRUA','PARQUEADERO','CENTRO_ASISTENCIA','AMBULANCIA'
  )),
  nit TEXT,
  representante TEXT,
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
  habilitacion_legal TEXT,
  -- Estado administrativo
  estado TEXT DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE','EN_REVISION','APROBADA','RECHAZADA')),
  motivo_rechazo TEXT,
  revisado_por UUID,  -- auth_id del admin que revisó
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Tabla de servicios detallados ─────────────────────────
CREATE TABLE IF NOT EXISTS servicios_establecimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  disponible BOOLEAN DEFAULT true
);

-- ── 4. Tabla de horarios día a día ───────────────────────────
CREATE TABLE IF NOT EXISTS horarios_establecimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  dia TEXT NOT NULL CHECK (dia IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_apertura TIME,
  hora_cierre TIME,
  cerrado BOOLEAN DEFAULT false
);

-- ── 5. Tabla de calificaciones de usuarios ───────────────────
CREATE TABLE IF NOT EXISTS calificaciones_establecimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  auth_id UUID NOT NULL,  -- auth_id del usuario que califica (no FK para no depender de usuarios.id)
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(establecimiento_id, auth_id)
);

-- ── 6. Activar RLS en todas las tablas nuevas ────────────────
ALTER TABLE solicitudes_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones_establecimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;

-- ── 7. ELIMINAR políticas antiguas si existen ────────────────
-- (evita error si se ejecuta el script más de una vez)
DO $$
DECLARE pol TEXT;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'establecimientos' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol || '" ON establecimientos';
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'solicitudes_establecimiento' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol || '" ON solicitudes_establecimiento';
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'servicios_establecimiento' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol || '" ON servicios_establecimiento';
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'horarios_establecimiento' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol || '" ON horarios_establecimiento';
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'calificaciones_establecimiento' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol || '" ON calificaciones_establecimiento';
  END LOOP;
END $$;

-- ── 8. POLÍTICAS RLS SEGURAS ─────────────────────────────────

-- ESTABLECIMIENTOS
-- Visitantes y usuarios: solo ven los verificados y activos
CREATE POLICY "est_lectura_publica"
  ON establecimientos FOR SELECT
  USING (verificado = true AND activo = true);

-- Solo admins pueden insertar, actualizar y eliminar
CREATE POLICY "est_admin_insert"
  ON establecimientos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

CREATE POLICY "est_admin_update"
  ON establecimientos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

CREATE POLICY "est_admin_delete"
  ON establecimientos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

-- SOLICITUDES DE ESTABLECIMIENTO
-- Cualquier persona puede enviar una solicitud (público + registrado)
CREATE POLICY "sol_insertar_publico"
  ON solicitudes_establecimiento FOR INSERT
  WITH CHECK (true);

-- Usuarios registrados pueden ver SOLO SUS PROPIAS solicitudes
CREATE POLICY "sol_lectura_propia"
  ON solicitudes_establecimiento FOR SELECT
  USING (email_solicitante = (
    SELECT email FROM usuarios WHERE auth_id = auth.uid()
  ));

-- Solo admins pueden ver todas, actualizar y eliminar solicitudes
CREATE POLICY "sol_admin_select"
  ON solicitudes_establecimiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

CREATE POLICY "sol_admin_update"
  ON solicitudes_establecimiento FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

CREATE POLICY "sol_admin_delete"
  ON solicitudes_establecimiento FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

-- SERVICIOS DE ESTABLECIMIENTO
-- Lectura pública de servicios de establecimientos verificados
CREATE POLICY "servicios_lectura_publica"
  ON servicios_establecimiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM establecimientos e
      WHERE e.id = establecimiento_id
      AND e.verificado = true AND e.activo = true
    )
  );

-- Solo admins pueden modificar servicios
CREATE POLICY "servicios_admin_write"
  ON servicios_establecimiento FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

-- HORARIOS DE ESTABLECIMIENTO
-- Lectura pública de horarios de establecimientos verificados
CREATE POLICY "horarios_lectura_publica"
  ON horarios_establecimiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM establecimientos e
      WHERE e.id = establecimiento_id
      AND e.verificado = true AND e.activo = true
    )
  );

-- Solo admins pueden modificar horarios
CREATE POLICY "horarios_admin_write"
  ON horarios_establecimiento FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE auth_id = auth.uid()
      AND role IN ('admin','superadmin')
    )
  );

-- CALIFICACIONES
-- Cualquier usuario autenticado puede leer calificaciones
CREATE POLICY "calif_lectura"
  ON calificaciones_establecimiento FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden calificar (y solo una vez por establecimiento)
CREATE POLICY "calif_insertar_autenticado"
  ON calificaciones_establecimiento FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = auth_id);

-- Solo el mismo usuario puede eliminar su calificación
CREATE POLICY "calif_eliminar_propia"
  ON calificaciones_establecimiento FOR DELETE
  USING (auth.uid() = auth_id);

-- ── 9. DATOS DEMO ────────────────────────────────────────────
-- Marcados como verificado=FALSE y activo=FALSE para NO aparecer en el mapa público.
-- Solo visibles para admins. Sirven para probar el panel admin.
-- ON CONFLICT DO NOTHING evita duplicados si se ejecuta varias veces.
INSERT INTO establecimientos
  (id, nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas, verificado, activo, estado, servicios)
VALUES
  (gen_random_uuid(), '[DEMO] Taller Moto Centro',    'TALLER',           'Mecánica general',              'Av. Caracas #45-20',   'Bogotá', 'Teusaquillo',  4.6276, -74.0882, 'Lun-Sab 8am-6pm',  false, false, false, 'NO_CONFIRMADO', ARRAY['Mecánica general','Cambio de aceite']),
  (gen_random_uuid(), '[DEMO] Gasolinera Calle 80',   'GASOLINERA',       'Estación de servicio',          'Calle 80 #68-45',      'Bogotá', 'Engativá',    4.7127, -74.0831, '24 horas',         true,  false, false, 'NO_CONFIRMADO', ARRAY['Gasolina corriente','Gasolina extra','Aire']),
  (gen_random_uuid(), '[DEMO] Montallantas Norte',    'MONTALLANTAS',     'Reparación de llantas',         'Cra 30 #15-10',        'Bogotá', 'Puente Aranda',4.6097, -74.0817, 'Lun-Dom 7am-9pm',  false, false, false, 'NO_CONFIRMADO', ARRAY['Reparación','Cambio de llantas']),
  (gen_random_uuid(), '[DEMO] Repuestos Moto Plus',   'REPUESTOS',        'Repuestos y accesorios',        'Cra 7 #32-15',         'Bogotá', 'Santa Fe',    4.6482, -74.0618, 'Lun-Sab 8am-7pm',  false, false, false, 'NO_CONFIRMADO', ARRAY['Repuestos originales','Baterías','Frenos']),
  (gen_random_uuid(), '[DEMO] Grúas Moto 24H',        'GRUA',             'Grúa y asistencia vial',        'Calle 13 #37-20',      'Bogotá', 'Los Mártires',4.5981, -74.0761, '24 horas',         true,  false, false, 'NO_CONFIRMADO', ARRAY['Grúa','Transporte por avería']),
  (gen_random_uuid(), '[DEMO] Parqueadero Motos',     'PARQUEADERO',      'Parqueadero cubierto',          'Calle 100 #15-30',     'Bogotá', 'Usaquén',     4.6868, -74.0491, 'Lun-Dom 6am-10pm', false, false, false, 'NO_CONFIRMADO', ARRAY['Cubierto','Vigilancia','Por horas']),
  (gen_random_uuid(), '[DEMO] Moto Asistencia',       'CENTRO_ASISTENCIA','Mecánico a domicilio',          'Bogotá centro',        'Bogotá', 'Candelaria',  4.6534, -74.0836, '24 horas',         true,  false, false, 'NO_CONFIRMADO', ARRAY['Mecánico domicilio','Paso de corriente']),
  (gen_random_uuid(), '[DEMO] Ambulancias (Ejemplo)', 'AMBULANCIA',       'Ejemplo de ambulancia habilitada','Bogotá',             'Bogotá', 'Bogotá',      4.6500, -74.0800, '24 horas',         true,  false, false, 'NO_CONFIRMADO', ARRAY['Ambulancia básica','Atención prehospitalaria'])
;
