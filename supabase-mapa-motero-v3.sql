-- ============================================================
-- MOTOSAFE – Mapa Motero v3 (SQL definitivo, seguro, idempotente)
-- Compatible con Supabase PostgreSQL
-- Sistema de roles verificado: usuarios.role IN ('user','admin','superadmin')
-- Identificación: usuarios.auth_id = auth.uid()
-- ============================================================
-- INSTRUCCIONES:
-- 1. Ejecutar completo en Supabase → Editor SQL
-- 2. Es idempotente: puede ejecutarse varias veces sin duplicar nada
-- 3. No modifica ni elimina datos existentes
-- ============================================================

-- ── PASO 1: Ampliar tabla establecimientos ───────────────────
-- Verifica cada columna antes de agregarla. No toca columnas existentes.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='nit')
  THEN ALTER TABLE establecimientos ADD COLUMN nit TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='representante')
  THEN ALTER TABLE establecimientos ADD COLUMN representante TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='localidad')
  THEN ALTER TABLE establecimientos ADD COLUMN localidad TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='servicios')
  THEN ALTER TABLE establecimientos ADD COLUMN servicios TEXT[]; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='tarifas')
  THEN ALTER TABLE establecimientos ADD COLUMN tarifas TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='estado')
  THEN ALTER TABLE establecimientos ADD COLUMN estado TEXT DEFAULT 'NO_CONFIRMADO'; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='es_24_horas')
  THEN ALTER TABLE establecimientos ADD COLUMN es_24_horas BOOLEAN DEFAULT false; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='servicio_domicilio')
  THEN ALTER TABLE establecimientos ADD COLUMN servicio_domicilio BOOLEAN DEFAULT false; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='foto_url')
  THEN ALTER TABLE establecimientos ADD COLUMN foto_url TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='documentos_verificados')
  THEN ALTER TABLE establecimientos ADD COLUMN documentos_verificados BOOLEAN DEFAULT false; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='habilitacion_legal')
  THEN ALTER TABLE establecimientos ADD COLUMN habilitacion_legal TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='establecimientos' AND column_name='activo')
  THEN ALTER TABLE establecimientos ADD COLUMN activo BOOLEAN DEFAULT true; END IF;
END $$;

-- ── PASO 2: Crear tablas nuevas ──────────────────────────────

-- Tabla de solicitudes de registro de establecimientos
CREATE TABLE IF NOT EXISTS solicitudes_establecimiento (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quién envía la solicitud
  nombre_solicitante  TEXT NOT NULL,
  celular_solicitante TEXT NOT NULL,
  email_solicitante   TEXT NOT NULL,  -- se usa para que el usuario vea sus propias solicitudes
  -- Datos del negocio
  nombre          TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN (
                    'GASOLINERA','TALLER','MONTALLANTAS','REPUESTOS',
                    'GRUA','PARQUEADERO','CENTRO_ASISTENCIA','AMBULANCIA'
                  )),
  nit             TEXT,
  representante   TEXT,
  descripcion     TEXT,
  direccion       TEXT NOT NULL,
  ciudad          TEXT NOT NULL,
  localidad       TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  telefono        TEXT,
  whatsapp        TEXT,
  horarios        TEXT,
  es_24_horas     BOOLEAN DEFAULT false,
  servicio_domicilio BOOLEAN DEFAULT false,
  servicios       TEXT[],
  tarifas         TEXT,
  foto_url        TEXT,
  habilitacion_legal TEXT,          -- obligatorio para AMBULANCIA
  -- Estado administrativo (solo el admin lo cambia)
  estado          TEXT DEFAULT 'PENDIENTE'
                    CHECK (estado IN ('PENDIENTE','EN_REVISION','APROBADA','RECHAZADA')),
  motivo_rechazo  TEXT,
  revisado_por    UUID,              -- auth_id del admin que revisó (no FK para flexibilidad)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de servicios detallados por establecimiento
CREATE TABLE IF NOT EXISTS servicios_establecimiento (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id   UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  nombre               TEXT NOT NULL,
  descripcion          TEXT,
  disponible           BOOLEAN DEFAULT true
);

-- Tabla de horarios día a día
CREATE TABLE IF NOT EXISTS horarios_establecimiento (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id   UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  dia                  TEXT NOT NULL CHECK (dia IN (
                         'lunes','martes','miercoles','jueves',
                         'viernes','sabado','domingo'
                       )),
  hora_apertura        TIME,
  hora_cierre          TIME,
  cerrado              BOOLEAN DEFAULT false
);

-- Tabla de calificaciones
-- auth_id es el auth.uid() de Supabase Auth del usuario que califica
-- UNIQUE(establecimiento_id, auth_id) evita que un usuario califique dos veces
CREATE TABLE IF NOT EXISTS calificaciones_establecimiento (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id   UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  auth_id              UUID NOT NULL,   -- auth.uid() del usuario autenticado
  calificacion         INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(establecimiento_id, auth_id)   -- un usuario, una calificación por lugar
);

-- ── PASO 3: Activar RLS en todas las tablas ──────────────────
ALTER TABLE establecimientos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_establecimiento     ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_establecimiento       ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_establecimiento        ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones_establecimiento  ENABLE ROW LEVEL SECURITY;

-- ── PASO 4: Eliminar políticas existentes (idempotencia) ─────
-- Borra políticas anteriores de estas tablas para recrearlas limpias.
-- No afecta otras tablas del proyecto.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'establecimientos',
        'solicitudes_establecimiento',
        'servicios_establecimiento',
        'horarios_establecimiento',
        'calificaciones_establecimiento'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── PASO 5: Crear políticas RLS ──────────────────────────────
-- Función auxiliar inline: verifica si el usuario autenticado es admin.
-- Usa usuarios.auth_id = auth.uid() y usuarios.role IN ('admin','superadmin')
-- exactamente como lo hace el proyecto (verificado en auth.ts y AuthContext.tsx).

-- ════════════════════════════════════════════════════════════
-- TABLA: establecimientos
-- ════════════════════════════════════════════════════════════

-- SELECT: público — solo ve los verificados Y activos
-- (los DEMO tienen verificado=false y activo=false, no aparecen)
CREATE POLICY "est_select_publico"
  ON establecimientos
  FOR SELECT
  USING (verificado = true AND activo = true);

-- INSERT: solo administradores
-- La subquery busca el auth_id del usuario actual en la tabla usuarios
-- y comprueba que su role sea 'admin' o 'superadmin'
CREATE POLICY "est_insert_solo_admin"
  ON establecimientos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- UPDATE: solo administradores
CREATE POLICY "est_update_solo_admin"
  ON establecimientos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- DELETE: solo administradores
CREATE POLICY "est_delete_solo_admin"
  ON establecimientos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- ════════════════════════════════════════════════════════════
-- TABLA: solicitudes_establecimiento
-- ════════════════════════════════════════════════════════════

-- INSERT: cualquier persona puede enviar una solicitud (público + registrado)
CREATE POLICY "sol_insert_publico"
  ON solicitudes_establecimiento
  FOR INSERT
  WITH CHECK (true);

-- SELECT para usuario registrado: solo ve sus propias solicitudes
-- Compara email_solicitante con el email del usuario autenticado en la tabla usuarios
CREATE POLICY "sol_select_propia"
  ON solicitudes_establecimiento
  FOR SELECT
  USING (
    email_solicitante = (
      SELECT usuarios.email
      FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
      LIMIT 1
    )
  );

-- SELECT para admin: ve todas las solicitudes
-- Esta política coexiste con la anterior (Supabase aplica OR entre políticas del mismo tipo)
CREATE POLICY "sol_select_admin"
  ON solicitudes_establecimiento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- UPDATE: solo administradores pueden cambiar el estado de una solicitud
CREATE POLICY "sol_update_solo_admin"
  ON solicitudes_establecimiento
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- DELETE: solo administradores
CREATE POLICY "sol_delete_solo_admin"
  ON solicitudes_establecimiento
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- ════════════════════════════════════════════════════════════
-- TABLA: servicios_establecimiento
-- ════════════════════════════════════════════════════════════

-- SELECT: público — solo servicios de establecimientos verificados y activos
CREATE POLICY "serv_select_publico"
  ON servicios_establecimiento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM establecimientos e
      WHERE e.id = servicios_establecimiento.establecimiento_id
        AND e.verificado = true
        AND e.activo = true
    )
  );

-- INSERT, UPDATE, DELETE: solo administradores
CREATE POLICY "serv_write_solo_admin"
  ON servicios_establecimiento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- ════════════════════════════════════════════════════════════
-- TABLA: horarios_establecimiento
-- ════════════════════════════════════════════════════════════

-- SELECT: público — solo horarios de establecimientos verificados y activos
CREATE POLICY "hora_select_publico"
  ON horarios_establecimiento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM establecimientos e
      WHERE e.id = horarios_establecimiento.establecimiento_id
        AND e.verificado = true
        AND e.activo = true
    )
  );

-- INSERT, UPDATE, DELETE: solo administradores
CREATE POLICY "hora_write_solo_admin"
  ON horarios_establecimiento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_id = auth.uid()
        AND usuarios.role IN ('admin', 'superadmin')
        AND usuarios.is_active = true
    )
  );

-- ════════════════════════════════════════════════════════════
-- TABLA: calificaciones_establecimiento
-- ════════════════════════════════════════════════════════════

-- SELECT: público — cualquiera puede leer calificaciones
CREATE POLICY "calif_select_publico"
  ON calificaciones_establecimiento
  FOR SELECT
  USING (true);

-- INSERT: solo usuarios autenticados
-- auth.uid() = auth_id garantiza que el usuario solo puede insertar con su propio ID
-- La restricción UNIQUE(establecimiento_id, auth_id) en la tabla evita duplicados
CREATE POLICY "calif_insert_autenticado"
  ON calificaciones_establecimiento
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = auth_id
  );

-- UPDATE: un usuario solo puede modificar su propia calificación
CREATE POLICY "calif_update_propia"
  ON calificaciones_establecimiento
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- DELETE: un usuario solo puede eliminar su propia calificación
CREATE POLICY "calif_delete_propia"
  ON calificaciones_establecimiento
  FOR DELETE
  USING (auth.uid() = auth_id);

-- ── PASO 6: Datos DEMO ───────────────────────────────────────
-- verificado=false Y activo=false → NO aparecen en el mapa público
-- Solo se insertan si no existe ya un registro con ese nombre exacto

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Taller Moto Centro', 'TALLER',
   'Mecánica general para motos — DATO DE PRUEBA',
   'Av. Caracas #45-20', 'Bogotá', 'Teusaquillo',
   4.6276, -74.0882, 'Lun-Sab 8am-6pm', false,
   false, false, 'NO_CONFIRMADO', ARRAY['Mecánica general','Cambio de aceite']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Taller Moto Centro');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Gasolinera Calle 80', 'GASOLINERA',
   'Estación de servicio — DATO DE PRUEBA',
   'Calle 80 #68-45', 'Bogotá', 'Engativá',
   4.7127, -74.0831, '24 horas', true,
   false, false, 'NO_CONFIRMADO', ARRAY['Gasolina corriente','Gasolina extra','Aire']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Gasolinera Calle 80');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Montallantas Norte', 'MONTALLANTAS',
   'Reparación y cambio de llantas — DATO DE PRUEBA',
   'Cra 30 #15-10', 'Bogotá', 'Puente Aranda',
   4.6097, -74.0817, 'Lun-Dom 7am-9pm', false,
   false, false, 'NO_CONFIRMADO', ARRAY['Reparación de pinchazos','Cambio de llantas']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Montallantas Norte');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Repuestos Moto Plus', 'REPUESTOS',
   'Repuestos y accesorios — DATO DE PRUEBA',
   'Cra 7 #32-15', 'Bogotá', 'Santa Fe',
   4.6482, -74.0618, 'Lun-Sab 8am-7pm', false,
   false, false, 'NO_CONFIRMADO', ARRAY['Repuestos originales','Baterías','Frenos']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Repuestos Moto Plus');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Grúas Moto 24H', 'GRUA',
   'Grúa y asistencia en carretera — DATO DE PRUEBA',
   'Calle 13 #37-20', 'Bogotá', 'Los Mártires',
   4.5981, -74.0761, '24 horas', true,
   false, false, 'NO_CONFIRMADO', ARRAY['Grúa','Transporte por avería']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Grúas Moto 24H');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Parqueadero Motos', 'PARQUEADERO',
   'Parqueadero cubierto y vigilado — DATO DE PRUEBA',
   'Calle 100 #15-30', 'Bogotá', 'Usaquén',
   4.6868, -74.0491, 'Lun-Dom 6am-10pm', false,
   false, false, 'NO_CONFIRMADO', ARRAY['Cubierto','Vigilancia','Por horas']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Parqueadero Motos');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Moto Asistencia', 'CENTRO_ASISTENCIA',
   'Mecánico a domicilio — DATO DE PRUEBA',
   'Bogotá centro', 'Bogotá', 'Candelaria',
   4.6534, -74.0836, '24 horas', true,
   false, false, 'NO_CONFIRMADO', ARRAY['Mecánico domicilio','Paso de corriente']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Moto Asistencia');

INSERT INTO establecimientos
  (nombre, tipo, descripcion, direccion, ciudad, localidad,
   lat, lng, horarios, es_24_horas,
   verificado, activo, estado, servicios)
SELECT '[DEMO] Ambulancias Ejemplo', 'AMBULANCIA',
   'Ejemplo de ambulancia — DATO DE PRUEBA — SIN HABILITACIÓN REAL',
   'Bogotá', 'Bogotá', 'Bogotá',
   4.6500, -74.0800, '24 horas', true,
   false, false, 'NO_CONFIRMADO', ARRAY['Ambulancia básica','Atención prehospitalaria']
WHERE NOT EXISTS (SELECT 1 FROM establecimientos WHERE nombre = '[DEMO] Ambulancias Ejemplo');
