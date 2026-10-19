# 🐾 HuellitasVet

Aplicación web de gestión para una clínica veterinaria. Permite administrar
mascotas, sus tutores, el agendamiento de citas, el historial clínico, la
emisión de boletas y la gestión de usuarios de la clínica.


## Arquitectura

| Capa      | Tecnología                                   | Puerto por defecto |
|-----------|----------------------------------------------|--------------------|
| Frontend  | React 18 + Vite (servido con Nginx)          | 8080               |
| API       | Node.js + Express + JWT + Swagger/OpenAPI    | 4000               |
| Base datos| PostgreSQL 15                                | 5433               |

## Puesta en marcha con Docker (recomendado)

```bash
cp .env.example .env
docker compose up -d --build
```

- Aplicación web: <http://localhost:8080>
- API: <http://localhost:4000>
- Documentación interactiva (Swagger): <http://localhost:4000/docs>

La base de datos se crea y se puebla automáticamente con los scripts de la
carpeta [`db/`](db/) la primera vez que se levanta el contenedor.

## Puesta en marcha manual (desarrollo)

```bash
# 1. Base de datos (requiere PostgreSQL local)
createdb huellitas
psql -d huellitas -f db/01-schema.sql
psql -d huellitas -f db/02-seed.sql

# 2. API
cd backend
cp .env.example .env
npm install
npm start           # http://localhost:4000

# 3. Frontend
cd ../frontend
npm install
npm run dev         # http://localhost:5173
```

## Usuarios de prueba

| Rol           | Email                        | Contraseña   |
|---------------|------------------------------|--------------|
| Administrador | admin@huellitas.cl           | Admin123!    |
| Veterinario   | camila.rojas@huellitas.cl    | Vet12345!    |
| Recepcionista | recepcion@huellitas.cl       | Recep123!    |
| Cliente       | maria.gonzalez@correo.cl     | Cliente123!  |

(Los 300 clientes generados usan el patrón `clienteN@correo.cl` / `Cliente123!`.)

## Roles y permisos

- **Administrador:** acceso total, gestión de usuarios y servicios.
- **Veterinario:** mascotas, citas (confirmar/atender), historial clínico.
- **Recepcionista:** agenda, boletas y listado de usuarios.
- **Cliente:** sus propias mascotas y el agendamiento de sus citas.

## Pruebas

```bash
cd backend
npm test            # Jest + Supertest, con cobertura
```

La suite incluida es una **base** pensada para que los equipos la amplíen con
sus propios casos funcionales y de regresión.

## Estructura del repositorio

```
.
├── backend/        API Express (rutas, middleware, OpenAPI, pruebas)
├── frontend/       Aplicación React + Vite
├── db/             Esquema y datos semilla de PostgreSQL
├── docs/           Documentación del proyecto
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Herramientas sugeridas para la evaluación

- **SAST:** SonarQube, Semgrep, `npm audit`.
- **DAST:** OWASP ZAP, Burp Suite.
- **Carga / rendimiento:** k6, Apache JMeter.
- **Funcional / API:** Postman/Newman, la suite Jest incluida.
