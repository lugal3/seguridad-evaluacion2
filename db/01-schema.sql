-- HuellitasVet - Esquema de base de datos
-- PostgreSQL 15+

CREATE TABLE usuarios (
  id              SERIAL PRIMARY KEY,
  rut             VARCHAR(12)  NOT NULL UNIQUE,
  nombre          VARCHAR(120) NOT NULL,
  email           VARCHAR(160) NOT NULL UNIQUE,
  telefono        VARCHAR(20),
  direccion       VARCHAR(200),
  password_hash   VARCHAR(64)  NOT NULL,
  rol             VARCHAR(20)  NOT NULL DEFAULT 'cliente'
                  CHECK (rol IN ('admin', 'veterinario', 'recepcionista', 'cliente')),
  especialidad    VARCHAR(80),
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  preferencias    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  reset_token     VARCHAR(64),
  creado_en       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE mascotas (
  id                SERIAL PRIMARY KEY,
  tutor_id          INTEGER      NOT NULL REFERENCES usuarios(id),
  nombre            VARCHAR(60)  NOT NULL,
  especie           VARCHAR(30)  NOT NULL,
  raza              VARCHAR(60),
  sexo              CHAR(1)      CHECK (sexo IN ('M', 'H')),
  fecha_nacimiento  DATE,
  peso_kg           NUMERIC(6,2),
  microchip         VARCHAR(20),
  observaciones     TEXT,
  activa            BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE servicios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  descripcion   TEXT,
  precio        INTEGER      NOT NULL,
  duracion_min  INTEGER      NOT NULL DEFAULT 30,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE citas (
  id              SERIAL PRIMARY KEY,
  mascota_id      INTEGER     NOT NULL REFERENCES mascotas(id),
  veterinario_id  INTEGER     NOT NULL REFERENCES usuarios(id),
  servicio_id     INTEGER     NOT NULL REFERENCES servicios(id),
  fecha_hora      TIMESTAMP   NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'agendada'
                  CHECK (estado IN ('agendada', 'confirmada', 'atendida', 'cancelada')),
  motivo          TEXT,
  creado_por      INTEGER     REFERENCES usuarios(id),
  creado_en       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE atenciones (
  id              SERIAL PRIMARY KEY,
  cita_id         INTEGER      REFERENCES citas(id),
  mascota_id      INTEGER      NOT NULL REFERENCES mascotas(id),
  veterinario_id  INTEGER      NOT NULL REFERENCES usuarios(id),
  fecha           TIMESTAMP    NOT NULL DEFAULT NOW(),
  peso_kg         NUMERIC(6,2),
  temperatura     NUMERIC(4,1),
  anamnesis       TEXT,
  diagnostico     TEXT,
  tratamiento     TEXT,
  notas           TEXT
);

CREATE TABLE vacunas (
  id                SERIAL PRIMARY KEY,
  mascota_id        INTEGER     NOT NULL REFERENCES mascotas(id),
  nombre            VARCHAR(80) NOT NULL,
  lote              VARCHAR(40),
  fecha_aplicacion  DATE        NOT NULL,
  proxima_dosis     DATE,
  aplicada_por      INTEGER     REFERENCES usuarios(id)
);

CREATE TABLE adjuntos (
  id             SERIAL PRIMARY KEY,
  mascota_id     INTEGER      NOT NULL REFERENCES mascotas(id),
  nombre_original VARCHAR(255) NOT NULL,
  archivo        VARCHAR(255) NOT NULL,
  mime           VARCHAR(100),
  tamano_bytes   INTEGER,
  subido_por     INTEGER      REFERENCES usuarios(id),
  creado_en      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE boletas (
  id           SERIAL PRIMARY KEY,
  cita_id      INTEGER     NOT NULL REFERENCES citas(id),
  subtotal     INTEGER     NOT NULL,
  descuento    INTEGER     NOT NULL DEFAULT 0,
  iva          INTEGER     NOT NULL,
  total        INTEGER     NOT NULL,
  metodo_pago  VARCHAR(20),
  pagada       BOOLEAN     NOT NULL DEFAULT FALSE,
  emitida_por  INTEGER     REFERENCES usuarios(id),
  creado_en    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER,
  accion      VARCHAR(60) NOT NULL,
  detalle     TEXT,
  ip          VARCHAR(60),
  creado_en   TIMESTAMP   NOT NULL DEFAULT NOW()
);
