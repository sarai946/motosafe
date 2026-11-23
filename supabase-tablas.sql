CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  tipo_documento TEXT DEFAULT 'CC',
  numero_documento TEXT,
  celular TEXT,
  ciudad TEXT,
  departamento TEXT,
  pais TEXT DEFAULT 'Colombia',
  foto_perfil TEXT,
  qr_code TEXT UNIQUE,
  qr_activo BOOLEAN DEFAULT true,
  mostrar_nombre BOOLEAN DEFAULT true,
  mostrar_celular BOOLEAN DEFAULT false,
  mostrar_ciudad BOOLEAN DEFAULT true,
  mostrar_placa_moto BOOLEAN DEFAULT true,
  mostrar_contactos BOOLEAN DEFAULT true,
  mostrar_info_medica BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS motocicletas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  cilindraje TEXT,
  color TEXT,
  anio INTEGER,
  tipo_moto TEXT DEFAULT 'propia',
  foto_moto TEXT,
  soat_vencimiento DATE,
  tecnomecanica_vencimiento DATE,
  licencia_vencimiento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contactos_emergencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  parentesco TEXT,
  celular TEXT NOT NULL,
  email TEXT,
  autorizado_notificaciones BOOLEAN DEFAULT true,
  es_contacto_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS info_medica (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
  grupo_sanguineo TEXT,
  eps TEXT,
  alergias TEXT,
  condiciones_medicas TEXT,
  medicamentos TEXT,
  observaciones TEXT,
  mostrar_en_emergencia BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conductores_ambulancia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  celular TEXT NOT NULL,
  placa_ambulancia TEXT NOT NULL,
  empresa TEXT NOT NULL,
  tipo_ambulancia TEXT DEFAULT 'BASICA',
  ciudad TEXT,
  estado TEXT DEFAULT 'INACTIVO',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  verificado BOOLEAN DEFAULT false,
  calificacion DECIMAL(3,2) DEFAULT 5.0,
  total_servicios INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitudes_ambulancia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accidentado_user_id TEXT,
  accidentado_nombres TEXT,
  accidentado_apellidos TEXT,
  accidentado_placa TEXT,
  accidentado_sangre TEXT,
  accidentado_eps TEXT,
  accidentado_alergias TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  direccion TEXT,
  maps_url TEXT,
  foto_url TEXT,
  estado TEXT DEFAULT 'PENDIENTE',
  conductor_id UUID REFERENCES conductores_ambulancia(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  aceptada_at TIMESTAMPTZ,
  completada_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reportes_emergencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  nombres TEXT,
  apellidos TEXT,
  placa TEXT,
  tipo_emergencia TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  direccion TEXT,
  estado TEXT DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas_viales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  reportado_por TEXT DEFAULT 'anonimo',
  verificada BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  votos_util INTEGER DEFAULT 0,
  votos_no_util INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  ciudad TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  telefono TEXT,
  whatsapp TEXT,
  horarios TEXT,
  calificacion DECIMAL(3,2),
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE solicitudes_ambulancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores_ambulancia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitudes_lectura" ON solicitudes_ambulancia FOR SELECT USING (true);
CREATE POLICY "solicitudes_insertar" ON solicitudes_ambulancia FOR INSERT WITH CHECK (true);
CREATE POLICY "solicitudes_actualizar" ON solicitudes_ambulancia FOR UPDATE USING (true);
CREATE POLICY "conductores_lectura" ON conductores_ambulancia FOR SELECT USING (true);
CREATE POLICY "conductores_insertar" ON conductores_ambulancia FOR INSERT WITH CHECK (true);
CREATE POLICY "conductores_actualizar" ON conductores_ambulancia FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE solicitudes_ambulancia;
ALTER PUBLICATION supabase_realtime ADD TABLE conductores_ambulancia;
