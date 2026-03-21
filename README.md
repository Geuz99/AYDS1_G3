# SaludPlus Backend

Backend del sistema de gestion de citas medicas SaludPlus.

Stack principal:

- Python 3.11
- Django 4.2
- Django REST Framework
- JWT con SimpleJWT
- PostgreSQL 15
- Docker + Docker Compose

## Lo que ya incluye este repositorio

- Proyecto Django funcional (`manage.py` + configuracion `config`).
- Modelo de usuario personalizado y perfiles de paciente/medico.
- Modelos transaccionales de agenda: horarios medicos y citas.
- API REST para pacientes, medicos, horarios y citas.
- Autenticacion JWT.
- Contenedores Docker para API y PostgreSQL.

## Requisitos previos

1. Git instalado.
2. Docker Desktop instalado y encendido.
3. Puerto `8000` libre para la API.
4. Puerto `5432` libre para PostgreSQL.

## Levantar el proyecto desde cero (paso a paso)

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd 'Carpeta en la que se ha clonado'
```

### 2. Verificar variables de entorno

Ya existe un archivo `.env` base para desarrollo. Si necesitas, puedes copiar desde `.env.example` y ajustar valores.

Variables principales:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `DJANGO_SETTINGS_MODULE`

### 3. Construir imagenes

```bash
docker compose build
```

### 4. Levantar servicios

```bash
docker compose up -d
```

Esto levanta:

- `db` (PostgreSQL 15) en `localhost:5432`
- `api` (Django) en `localhost:8000`

### 5. Verificar que todo este arriba

```bash
docker compose ps
docker compose logs api --tail 100
```

Si todo esta bien, deberias ver Django ejecutandose en `http://0.0.0.0:8000/`.

## Superusuario (admin)

### Crear superusuario manualmente

```bash
docker compose exec api python manage.py createsuperuser
```

### Superusuario de desarrollo usado en esta configuracion

En la sesion de configuracion se creo este usuario:

- Usuario: `admin`
- Email: `admin@saludplus.local`
- Password: `Admin12345!`

Recomendacion: cambiar esa password inmediatamente en cuanto ingreses.

## Accesos principales

- Admin Django: `http://localhost:8000/admin/`
- API base: `http://localhost:8000/api/`

## Endpoints disponibles

Autenticacion y registro:

- `POST /api/auth/register/patient/`
- `POST /api/auth/register/doctor/`
- `POST /api/auth/login/`
- `POST /api/auth/token/` (compatibilidad con clientes existentes)
- `POST /api/auth/token/refresh/`

## HU-01 Registro de nuevo paciente

Endpoint:

- `POST /api/auth/register/patient/`

Campos esperados (multipart/form-data):

- `nombre` (requerido)
- `apellido` (requerido)
- `dpi` (requerido, 13 digitos)
- `genero` (requerido: `M`, `F`, `O`)
- `direccion` (requerido)
- `telefono` (requerido, `+502XXXXXXXX` o `XXXXXXXX`)
- `fecha_nacimiento` (requerido, formato `YYYY-MM-DD`)
- `correo_electronico` (requerido, unico)
- `password` (requerido)
- `fotografia` (opcional)

Validaciones clave de HU-01:

1. La contraseña exige minimo 8 caracteres, al menos 1 minuscula, 1 mayuscula y 1 numero.
2. El correo se valida como unico contra `users_user.email`, `users_patient.correo_electronico` y `users_doctor.correo_electronico`.
3. La contraseña se almacena cifrada (hash) usando `set_password` de Django.
4. Si no se envia `username`, se genera automaticamente a partir del correo.

Ejemplo rapido con cURL (sin fotografia):

```bash
curl -X POST http://localhost:8000/api/auth/register/patient/ \
   -F "nombre=Juan" \
   -F "apellido=Perez" \
   -F "dpi=1234567890123" \
   -F "genero=M" \
   -F "direccion=Zona 10" \
   -F "telefono=12345678" \
   -F "fecha_nacimiento=1995-05-20" \
   -F "correo_electronico=juan.perez@correo.com" \
   -F "password=ClaveSegura1"
```

Frontend relacionado:

- Pantalla de registro de paciente: `http://localhost:3000/register`

CRUD:

- `GET|POST|PUT|PATCH|DELETE /api/patients/`
- `GET|POST|PUT|PATCH|DELETE /api/doctors/`
- `GET|POST|PUT|PATCH|DELETE /api/horarios/`
- `GET|POST|PUT|PATCH|DELETE /api/citas/`

Modelos de agenda incluidos:

- `Horario`: define dias de atencion (`MON..SUN`) y rango `hora_inicio`/`hora_fin` por medico.
- `CitaMedica`: relaciona paciente-medico con fecha, hora, motivo, tratamiento y estado.

## Seguridad y permisos

1. `patients`, `doctors`, `horarios` y `citas` requieren JWT.
2. Registro y token son endpoints publicos.
3. Operaciones de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) en `patients` y `doctors` estan restringidas a usuarios con `is_staff` o rol `ADMIN`.
4. Contrasenas de usuarios se almacenan en hash con mecanismos nativos de Django.
5. El modelo de usuario incluye un campo para segunda contrasena hasheada para escenarios de validacion de administrador.

Permisos por objeto implementados:

- Paciente: solo puede ver/editar su propio perfil y sus propias citas.
- Medico: solo puede ver/editar su propio perfil, sus propios horarios y sus propias citas.
- Admin/Staff: acceso global.

Reglas de negocio en agenda:

- Un paciente no puede tener dos citas en la misma fecha y hora.
- Un medico no puede tener dos citas en la misma fecha y hora.
- No se permiten traslapes entre horarios del mismo medico.
- Una cita solo puede programarse dentro de un horario habilitado del medico (dia y hora).
- Para marcar una cita como `ATENDIDA`, se requiere registrar `tratamiento`.

## Flujo rapido para probar JWT

### 1. Iniciar sesion

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
   -d '{"email":"admin@saludplus.local","password":"Admin12345!"}'
```

Tambien puedes usar el endpoint compatible heredado:

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
   -H "Content-Type: application/json" \
    -d '{"email":"admin@saludplus.local","password":"Admin12345!"}'
```

Respuesta esperada: JSON con `access`, `refresh` y metadatos de usuario.

### 2. Consumir endpoint protegido

```bash
curl http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

## Comandos utiles de operacion

Levantar todo:

```bash
docker compose up -d
```

Reconstruir (si cambian dependencias o Dockerfile):

```bash
docker compose up -d --build
```

Ver logs:

```bash
docker compose logs -f api
docker compose logs -f db
```

Parar servicios:

```bash
docker compose down
```

Parar y eliminar volumen de DB (reseteo completo de datos):

```bash
docker compose down -v
```

## Troubleshooting rapido

1. Error `docker: command not found`.
   Docker Desktop no esta instalado o no esta en PATH.
2. Puerto ocupado (`8000` o `5432`).
   Libera el puerto o cambia mapeos en `docker-compose.yml`.
3. API no levanta por migraciones.
   Revisa logs con `docker compose logs api --tail 200`.
4. No autentica JWT.
   Verifica usuario/password y que el token se envie con prefijo `Bearer `.

## Nota para desarrollo

Esta configuracion esta orientada a desarrollo local. Para produccion se recomienda:

1. Secretos fuera del repositorio.
2. `DEBUG=False`.
3. `ALLOWED_HOSTS` restringido.
4. Servidor WSGI/ASGI productivo (Gunicorn/Uvicorn) y reverse proxy.
