# SaludPlus — Frontend

Interfaz web del sistema de gestión de citas médicas SaludPlus.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Docker

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Docker Desktop (si se corre junto al backend)

---

## Variables de entorno

Crea un archivo `.env.local` en esta carpeta (o configúralo en `docker-compose.yml`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Nota CORS:** El backend (`django-cors-headers`) debe tener `http://localhost:3000`  
> en `CORS_ALLOWED_ORIGINS` (ya configurado en `config/settings.py`) y el middleware  
> `corsheaders.middleware.CorsMiddleware` como **primer middleware** en `MIDDLEWARE`.

---

## Levantar en desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Con Docker (junto al backend)

Desde la raíz del repositorio:

```bash
docker compose up -d
```

El frontend estará en `http://localhost:3000`.

---
## Pantallas clave implementadas

- Login: `http://localhost:3000/login`
- Registro de paciente (HU-01): `http://localhost:3000/register` y `http://localhost:3000/registro/paciente`

El formulario de registro de paciente consume `POST /api/auth/register/patient/` y envia los datos en `multipart/form-data`, incluyendo `fotografia` como campo opcional.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Estructura del proyecto

```
src/
├── app/                        # App Router (Next.js)
│   ├── (auth)/                 # Route group — layout max-w-md (login, 2FA)
│   │   ├── login/
│   │   ├── register/           # Placeholder de registro general
│   │   └── admin-2fa/
│   ├── dashboard/              # Paneles por rol (admin, doctor, paciente)
│   ├── registro/
│   │   └── medico/             # HU-02: Formulario de registro de médico
│   │       └── page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── DoctorRegistrationForm.tsx   # HU-02: Formulario multipart con validación
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── LogoutButton.tsx
└── lib/
    ├── api.ts                  # Cliente HTTP con JWT
    └── auth.ts                 # Helpers de sesión (SimpleJWT)
```

---

## Rutas disponibles

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión (JWT) |
| `/admin-2fa` | Verificación 2FA para administradores |
| `/registro/medico` | **HU-02** — Registro de nuevo médico |
| `/dashboard` | Redirección según rol |
| `/dashboard/admin` | Panel de administrador |
| `/dashboard/doctor` | Panel de médico |
| `/dashboard/paciente` | Panel de paciente |

---

## HU-02: Registro de Médico

### Componente

**`src/components/DoctorRegistrationForm.tsx`**

Formulario con los siguientes campos organizados en 4 secciones:

| Sección | Campos |
|---|---|
| Credenciales | `username`, `password`, `email` |
| Datos personales | `nombre`, `apellido`, `dpi`, `fecha_nacimiento`, `genero`, `direccion`, `telefono` |
| Datos profesionales | `numero_colegiado`, `especialidad`, `direccion_clinica`, `correo_electronico` |
| Fotografía | `fotografia` (`<input type="file" accept="image/*">` con preview) |

**Decisiones de implementación:**

- Usa `FormData` + `fetch` directamente — **no** usa `apiRequest()` de `lib/api.ts`  
  porque esa función fuerza `Content-Type: application/json`, lo que invalida el boundary de `multipart/form-data`.
- Los errores de validación de Django (`errors.campo`) se muestran inline bajo cada campo.
- Al recibir HTTP 201, muestra mensaje de éxito y resetea el formulario.

### Endpoint que consume

```
POST http://localhost:8000/api/auth/register/doctor/
Content-Type: multipart/form-data
```

Respuesta exitosa: `HTTP 201` con el perfil del médico creado.  
Respuesta de error: `HTTP 400` con `{ "message": "...", "errors": { "campo": ["..."] } }`.

---

## Comandos útiles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Linter ESLint
```
