# Manual Técnico — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

---

## 1. Arquitectura del Sistema

SaludPlus utiliza una arquitectura de tres capas completamente contenedorizada con Docker:

```
┌─────────────────────────────────────────┐
│              Cliente (Browser)           │
└────────────────────┬────────────────────┘
                     │ HTTP / HTTPS
┌────────────────────▼────────────────────┐
│   Frontend — Next.js 16 (puerto 3000)   │
│   TypeScript 5 + Tailwind CSS 4         │
└────────────────────┬────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────┐
│  Backend — Django 4.2 + DRF (puerto 8000)│
│  SimpleJWT + Python 3.11 + Pillow        │
└────────────────────┬────────────────────┘
                     │ SQL (puerto 5432)
┌────────────────────▼────────────────────┐
│   Base de Datos — PostgreSQL 15          │
│   Volumen persistente Docker             │
└─────────────────────────────────────────┘
```

Todos los servicios se orquestan con `docker-compose.yml` y se comunican a través de la red interna de Docker (`saludplus_network`).

---

## 2. Tecnologías Utilizadas

| Componente | Tecnología | Versión | Rol |
|-----------|------------|---------|-----|
| Frontend | Next.js | 16 | Interfaz de usuario SSR |
| Estilos | Tailwind CSS | 4 | Diseño responsive |
| Lenguaje frontend | TypeScript | 5 | Tipado estático |
| Backend | Django | 4.2 | Framework web principal |
| API REST | Django REST Framework | 3.15 | Serialización y endpoints |
| Autenticación | SimpleJWT | 5.3 | Tokens JWT |
| Base de Datos | PostgreSQL | 15 | Persistencia de datos |
| Contenedores | Docker + Compose | Latest | Orquestación |
| Imágenes | Pillow | 10+ | Procesamiento de fotos |
| Encriptación | PBKDF2 (Django default) | — | Hash de contraseñas |
| Correos | Django send_mail + SMTP | — | Notificaciones |

---

## 3. Decisiones Técnicas Justificadas

### 3.1 Django REST Framework sobre FastAPI
Se eligió DRF porque el equipo ya tenía experiencia con Django ORM. DRF ofrece serializers con validaciones complejas integradas (unicidad cruzada de correos, formato DPI, edad mínima), autenticación lista con SimpleJWT, y el admin de Django facilita la inspección de datos durante desarrollo. FastAPI sería más performante, pero requería más configuración manual para las mismas validaciones.

### 3.2 SimpleJWT sobre django-allauth o sesiones
Los tokens JWT permiten una arquitectura stateless: el frontend y el backend son contenedores independientes que no comparten sesión. El JWT incluye el rol del usuario (`ADMIN`, `DOCTOR`, `PATIENT`) para que el frontend tome decisiones de routing sin hacer llamadas adicionales a la API. `django-allauth` está orientado a OAuth social, que no era requerido.

### 3.3 PostgreSQL sobre MySQL o SQLite
PostgreSQL fue elegido por tres razones técnicas concretas:
- Soporta `JSONField` nativo para `dias_semana` en el modelo `Horario`, sin extensiones.
- Permite constraints compuestos (`UniqueConstraint`) para evitar citas duplicadas a nivel de base de datos.
- Tiene mejor soporte en Django para queries complejas de disponibilidad de horarios con operadores de rango.
SQLite no es adecuado para producción y MySQL tiene soporte limitado de JSONField en versiones antiguas.

### 3.4 Next.js 16 sobre React puro o Vue
Next.js provee SSR (Server Side Rendering) que mejora el tiempo de carga inicial y el SEO. El sistema de rutas por directorios (`app/`) simplifica la organización de páginas por rol (`dashboard/admin/`, `dashboard/doctor/`, `dashboard/paciente/`). La integración con TypeScript es nativa y Tailwind CSS 4 funciona sin configuración adicional.

### 3.5 Docker Compose sobre instalación directa
Garantiza que todos los integrantes del equipo trabajen con el mismo entorno independientemente del sistema operativo. Elimina conflictos de versiones de Python, Node y PostgreSQL. El sistema completo levanta con un solo comando (`docker compose up`), reduciendo la fricción para nuevos colaboradores.

### 3.6 AbstractUser sobre modelo de usuario personalizado desde cero
Django's `AbstractUser` provee campos de autenticación probados (password hash, last_login, is_active) sin reimplementar seguridad. Se extendió con `role` y `approval_status` mediante herencia, y los perfiles de paciente/médico se vinculan con `OneToOneField` para separar responsabilidades sin tablas monolíticas.

---

## 4. Estructura del Proyecto

```
AYDS1_G3/
├── config/                      # Configuración Django
│   ├── settings.py              # Settings principales
│   ├── urls.py                  # URLs raíz
│   ├── asgi.py
│   └── wsgi.py
├── users/                       # App principal
│   ├── models.py                # User, Patient, Doctor, Horario, CitaMedica
│   ├── serializers.py           # Serializers CRUD
│   ├── serializers_auth.py      # Login, ChangePassword
│   ├── views.py                 # ViewSets CRUD
│   ├── views_auth.py            # Login, 2FA, ChangePassword
│   ├── views_admin.py           # Aprobación usuarios, cambio 2FA
│   ├── views_reportes.py        # Reportes administrativos
│   ├── urls.py                  # Endpoints registrados
│   ├── admin.py                 # Django Admin
│   └── migrations/              # Migraciones de BD
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/          # Login, registro, 2FA
│       │   │   ├── login/
│       │   │   ├── 2fa/
│       │   │   └── registro/
│       │   └── (dashboard)/     # Dashboards por rol
│       │       └── dashboard/
│       │           ├── admin/
│       │           ├── doctor/
│       │           └── paciente/
│       ├── components/          # Componentes reutilizables
│       └── lib/
│           ├── auth.ts          # Helpers de sesión y routing
│           └── api.ts           # URL base de la API
├── scripts/
│   ├── seed_data.py             # Datos de prueba
│   └── readme.md                # Credenciales de prueba completas
├── media/                       # Archivos subidos
│   ├── doctors/                 # Fotografías de médicos
│   └── patients/                # Fotografías de pacientes
├── Docs/                        # Documentación del proyecto
├── Dockerfile                   # Imagen del backend
├── docker-compose.yml           # Orquestación de servicios
├── entrypoint.sh                # Script de inicio (migraciones + servidor)
└── requirements.txt             # Dependencias Python
```

---

## 5. Modelo de Base de Datos

### Diagrama Entidad-Relación

![Diagrama ER](imagenes/DiagramaER.png)

### Descripción de Entidades

**USER** (extiende AbstractUser de Django)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INT | PK | Identificador único |
| username | VARCHAR(150) | UNIQUE | Nombre de usuario |
| email | VARCHAR(254) | UNIQUE | Correo electrónico |
| password | VARCHAR(128) | — | Hash PBKDF2 de contraseña |
| role | VARCHAR(10) | CHOICE | ADMIN, DOCTOR, PATIENT |
| approval_status | VARCHAR(10) | CHOICE | PENDING, APPROVED, REJECTED, INACTIVE |
| second_password_hash | VARCHAR(128) | NULL | Segunda contraseña 2FA del admin |
| is_active | BOOLEAN | DEFAULT True | Usuario activo |
| date_joined | DATETIME | — | Fecha de registro |

**PATIENT** (perfil del paciente)

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | INT | PK | Identificador único |
| user_id | INT | FK(User), UNIQUE | Relación 1:1 con User |
| nombre / apellido | VARCHAR(120) | — | Nombre completo |
| dpi | VARCHAR(13) | UNIQUE | 13 dígitos exactos |
| genero | CHAR(1) | CHOICE | M, F, O |
| telefono | VARCHAR(15) | — | Formato +502XXXXXXXX u 8 dígitos |
| fecha_nacimiento | DATE | — | Edad mínima 18 años |
| correo_electronico | VARCHAR(254) | UNIQUE | Único cruzado con Doctor y User |
| fotografia | IMAGE | NULL | Ruta en /media/patients/ |

**DOCTOR** — igual que PATIENT más: `numero_colegiado` (UNIQUE), `especialidad`, `direccion_clinica`. Fotografía obligatoria en `/media/doctors/`.

**HORARIO** (disponibilidad médica)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| doctor_id | FK(Doctor) | Médico dueño del horario |
| dias_semana | JSONField | Lista: ["MON","TUE","WED","THU","FRI"] |
| hora_inicio | TIME | Hora de inicio de atención |
| hora_fin | TIME | Hora de fin de atención |

**CITA_MEDICA**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| paciente_id | FK(Patient) | Paciente de la cita |
| medico_id | FK(Doctor) | Médico de la cita |
| fecha_cita | DATE | Fecha programada |
| hora_cita | TIME | Hora programada |
| motivo_cita | TEXT | Motivo de consulta |
| tratamiento | TEXT, NULL | Diagnóstico (solo en ATENDIDA) |
| estado | VARCHAR(25) | ACTIVA, ATENDIDA, CANCELADA_PACIENTE, CANCELADA_MEDICO |

### Cardinalidades

```
USER      (1) ──────── (1) PATIENT
USER      (1) ──────── (1) DOCTOR
DOCTOR    (1) ──────── (N) HORARIO
PATIENT   (1) ──────── (N) CITA_MEDICA
DOCTOR    (1) ──────── (N) CITA_MEDICA
```

### Constraints de Integridad

```sql
-- Evita citas duplicadas para el mismo paciente
UNIQUE (paciente_id, fecha_cita, hora_cita)

-- Evita citas duplicadas para el mismo médico
UNIQUE (medico_id, fecha_cita, hora_cita)

-- Unicidad cruzada de correo (validada en serializer)
correo_electronico UNIQUE en Patient
correo_electronico UNIQUE en Doctor
email UNIQUE en User
```

---

## 6. Endpoints de la API

### Autenticación (públicos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register/patient/` | Registro de paciente (multipart/form-data) |
| POST | `/api/auth/register/doctor/` | Registro de médico (multipart/form-data) |
| POST | `/api/auth/login/` | Login por email y contraseña |
| POST | `/api/auth/token/refresh/` | Renovar access token JWT |
| POST | `/api/auth/admin/verify-2fa/` | Verificar archivo 2FA del admin |

### Protegidos (requieren JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/change-password/` | Cambiar contraseña propia |
| GET/POST | `/api/patients/` | Listar/crear pacientes |
| GET/POST | `/api/doctors/` | Listar/crear médicos |
| GET | `/api/doctors/{id}/disponibilidad/?fecha=YYYY-MM-DD` | Disponibilidad del médico |
| GET/POST | `/api/horarios/` | Listar/crear horarios |
| GET/POST | `/api/citas/` | Listar/crear citas |
| PATCH | `/api/citas/{id}/` | Actualizar estado de cita |
| PATCH | `/api/users/{id}/` | Cambiar approval_status (admin) |
| GET | `/api/admin/reportes/` | Reportes administrativos |
| POST | `/api/admin/change-2fa/` | Cambiar segunda contraseña admin |

---

## 7. Requisitos Previos

- Docker Desktop instalado y corriendo
- Git instalado
- Puertos disponibles: `3000` (frontend), `8000` (API), `5432` (PostgreSQL)

---

## 8. Variables de Entorno

Copiar `.env.example` a `.env` y ajustar los valores:

| Variable | Descripción | Valor por defecto (dev) |
|----------|-------------|------------------------|
| `POSTGRES_DB` | Nombre de la base de datos | `saludplus` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `saludplus_user` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `saludplus_pass` |
| `DB_NAME` | Nombre de BD para Django | `saludplus` |
| `DB_USER` | Usuario de BD para Django | `saludplus_user` |
| `DB_PASSWORD` | Contraseña de BD para Django | `saludplus_pass` |
| `DB_HOST` | Host de la BD (nombre del servicio Docker) | `db` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `SECRET_KEY` | Clave secreta de Django | Cambiar en producción |
| `DEBUG` | Modo debug de Django | `True` |
| `DJANGO_SETTINGS_MODULE` | Módulo de settings | `config.settings` |
| `EMAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Puerto SMTP | `587` |
| `EMAIL_HOST_USER` | Correo remitente | — |
| `EMAIL_HOST_PASSWORD` | App password del correo | — |

---

## 9. Instalación y Configuración

### 9.1 Clonar el repositorio

```bash
git clone https://github.com/Geuz99/AYDS1_G3.git
cd AYDS1_G3
git checkout develop
```

### 9.2 Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con los valores apropiados
```

### 9.3 Construir las imágenes

```bash
docker compose build
```

### 9.4 Levantar todos los servicios

```bash
docker compose up -d
```

Esto levanta:
- `db` (PostgreSQL 15) en `localhost:5432`
- `api` (Django + migraciones automáticas) en `localhost:8000`
- `frontend` (Next.js) en `localhost:3000`

### 9.5 Verificar que todo esté corriendo

```bash
docker compose ps
docker compose logs api --tail 50
```

### 9.6 Crear superusuario manualmente (opcional)

```bash
docker compose exec api python manage.py createsuperuser
```

### 9.7 Cargar datos de prueba

```bash
docker compose exec api python manage.py shell < scripts/seed_data.py
```

Esto crea los siguientes usuarios de prueba:

| Rol | Correo | Contraseña | 2FA |
|-----|--------|------------|-----|
| Admin | admin@saludplus.local | Admin12345! | Admin2FA789! |
| Paciente | paciente1@test.com | Paciente123! | — |
| Médico | doctor1@test.com | Doctor123! | — |

### 9.8 Accesos principales

- Frontend: http://localhost:3000
- API: http://localhost:8000/api/
- Admin Django: http://localhost:8000/admin/

---

## 10. Flujo de Autenticación

### Login de Paciente / Médico

```
POST /api/auth/login/
{ "email": "...", "password": "..." }

→ Respuesta: { "access": "JWT...", "refresh": "JWT...", "role": "PATIENT", "user_id": 1 }
→ Frontend guarda token en localStorage
→ Redirige a /dashboard/paciente/ o /dashboard/doctor/
```

### Login del Administrador (2FA)

```
1. POST /api/auth/login/  →  { "requires_2fa": true }
2. Frontend redirige a /2fa
3. Usuario sube archivo auth2-ayd1.txt con su segunda contraseña
4. POST /api/auth/admin/verify-2fa/  →  { "access": "JWT...", "role": "ADMIN" }
5. Frontend redirige a /dashboard/admin/
```

### Renovar Token

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "TU_REFRESH_TOKEN"}'
```

---

## 11. Reglas de Negocio Implementadas

| Regla | Implementación |
|-------|---------------|
| Correo único cruzado | Validación en serializer contra User, Patient y Doctor |
| DPI único (13 dígitos) | UNIQUE constraint + regex en serializer |
| Edad mínima 18 años | Validación de fecha en serializer |
| Contraseña segura | Regex: mín. 8 chars, 1 mayúscula, 1 minúscula, 1 número |
| Solo usuarios APPROVED pueden iniciar sesión | Validación en `CustomTokenObtainPairSerializer` |
| Cita dentro del horario del médico | `_find_matching_horario()` en serializer de citas |
| No duplicar citas (paciente y médico) | UNIQUE compuesto + validación en serializer |
| Tratamiento obligatorio para marcar ATENDIDA | Validación en `CitaMedicaSerializer.validate()` |
| No modificar horario con citas activas fuera del rango | Validación en `HorarioSerializer` |

---

## 12. Comandos Útiles de Operación

```bash
# Levantar todos los servicios
docker compose up -d

# Reconstruir si cambian dependencias o Dockerfile
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f api
docker compose logs -f frontend

# Ejecutar migraciones manualmente
docker compose exec api python manage.py migrate

# Acceder al shell de Django
docker compose exec api python manage.py shell

# Acceder a PostgreSQL directamente
docker compose exec db psql -U saludplus_user -d saludplus

# Parar servicios
docker compose down

# Parar y eliminar volumen de BD (reset completo)
docker compose down -v

# Reiniciar solo el backend
docker compose restart api
```

---

## 13. Troubleshooting

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| `docker: command not found` | Docker Desktop no instalado | Instalar Docker Desktop |
| Puerto 8000/3000/5432 ocupado | Otro proceso usa el puerto | `lsof -i :8000` y liberar, o cambiar mapeo en `docker-compose.yml` |
| API no levanta — error de migraciones | BD no lista al iniciar Django | `docker compose restart api` después de que `db` esté healthy |
| `Failed to fetch` en registro | CORS no configurado | Verificar `corsheaders` en `INSTALLED_APPS` y como primer middleware |
| JWT inválido o expirado | Token vencido | Usar `/api/auth/token/refresh/` con el refresh token |
| `approval_status PENDING` — no puede hacer login | Usuario no aprobado | Admin debe aprobar desde el panel |
| Imágenes no se sirven | `MEDIA_ROOT` no montado | Verificar volumen de media en `docker-compose.yml` |
| Error 500 en número colegiado duplicado | Constraint de BD sin validación previa | Verificar `validate_numero_colegiado` en `DoctorRegistrationSerializer` |

---

## 14. Consideraciones para Producción

Esta configuración está orientada a desarrollo local. Para un ambiente de producción se recomienda:

1. `DEBUG=False` en las variables de entorno.
2. `SECRET_KEY` generado aleatoriamente y almacenado en gestor de secretos.
3. `ALLOWED_HOSTS` restringido al dominio real.
4. Servidor WSGI/ASGI productivo (Gunicorn + Nginx o Uvicorn).
5. Certificado SSL/TLS (HTTPS obligatorio).
6. `CORS_ALLOWED_ORIGINS` restringido al dominio del frontend.
7. Backups automatizados del volumen de PostgreSQL.
8. Variables de entorno gestionadas fuera del repositorio (AWS Secrets Manager, Vault, etc.).