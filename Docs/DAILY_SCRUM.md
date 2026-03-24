# Daily Scrum — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

**Equipo:**
- Allan Josué Rafael Morales — 201709196 — Product Owner
- Roger Alberto Rivera Alvarez — 201800551 — Scrum Master
- Wilmer Estuardo Vásquez Raxón — 201800678 — Developer
- Anderson Gerardo Zuleta Galdámez — 201800500 — Developer

---

# Sprint 1 — 9 al 15 de marzo de 2026

## Daily Scrum 1 — Lunes 9 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | No aplicaba (inicio del sprint, reunión de planning realizada). | Configurar el entorno de Next.js y conectar con docker-compose. | Ninguno por el momento. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | No aplicaba (inicio del sprint). | Implementar el serializer personalizado de login por email con SimpleJWT. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | No aplicaba (inicio del sprint). | Diseñar el formulario de registro de paciente con todas las validaciones requeridas. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | No aplicaba (inicio del sprint). | Configurar los contenedores Docker para el proyecto. | Ninguno. |

## Daily Scrum 2 — Martes 10 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Configuré la estructura inicial del proyecto frontend en Next.js. | Conectar el frontend con el backend Django mediante variables de entorno. | Tuve un problema con la versión de Node en el contenedor, ya lo resolví. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Implementé el serializer de login que autentica por email en lugar de username. | Agregar validación de approval_status para pacientes y médicos. | Tuve un conflicto con el TokenObtainPairSerializer, lo resolví creando uno independiente. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Diseñé la estructura del formulario de registro de paciente. | Implementar validaciones de correo, DPI, teléfono y contraseña. | Tuve dudas sobre el formato del DPI, lo aclaré con el equipo. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Configuré el Dockerfile del backend y el docker-compose.yml inicial. | Levantar la base de datos PostgreSQL y verificar la conexión. | Tuve un problema con el puerto 5432 ya ocupado, lo resolví cambiando la configuración. |

## Daily Scrum 3 — Miércoles 11 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Logré conectar el frontend con el API del backend. | Crear las páginas base: layout, navbar y footer. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Implementé la validación de approval_status (PENDING, REJECTED, INACTIVE). | Crear el endpoint de 2FA para el administrador con subida de archivo. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Implementé las validaciones del formulario de registro. | Conectar el formulario con el endpoint /api/auth/register/patient/. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Levanté la base de datos y verifiqué la conexión desde el API. | Ejecutar las migraciones iniciales y verificar los modelos. | Ninguno. |

## Daily Scrum 4 — Jueves 12 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Creé el layout principal, navbar y footer del sistema. | Iniciar la página de inicio (landing) con la descripción del sistema. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Creé el endpoint /api/auth/admin/verify-2fa/ con validación del archivo auth2-ayd1.txt. | Crear las páginas de login y 2FA en Next.js. | Hubo un problema con CORS, lo resolví agregando corsheaders al settings.py. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Conecté el formulario con el backend, los datos se guardan correctamente. | Agregar encriptación de contraseña y validar correos duplicados. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Ejecuté las migraciones correctamente, todos los modelos están en la BD. | Configurar el entorno de variables (.env) para el equipo. | Ninguno. |

## Daily Scrum 5 — Viernes 13 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Completé la página de inicio con las tarjetas de módulos. | Revisar y documentar el avance del sprint 1. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Creé las páginas de login y 2FA con manejo de sesión en localStorage. | Agregar navbar dinámico y dashboards por rol. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Verifiqué que la contraseña se almacena encriptada en la base de datos. | Hacer pruebas completas del flujo de registro. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Configuré el archivo .env.example para que el equipo pueda levantar el proyecto. | Documentar el proceso de configuración del entorno local. | Ninguno. |

## Daily Scrum 6 — Sábado 14 de marzo de 2026 — 9:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Revisé todos los avances del equipo y documenté el sprint 1. | Preparar retrospectiva y evidencias del sprint 1. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Completé navbar dinámico, logout y dashboards temporales por rol. | Hacer merge a develop y documentar el módulo. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Completé las pruebas del registro de paciente, todo funciona correctamente. | Preparar evidencias y documentar la HU-01. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Documenté el proceso de setup en el README.md. | Preparar evidencias del sprint 1. | Ninguno. |

---

# Sprint 2 — 16 al 22 de marzo de 2026

## Daily Scrum 7 — Lunes 16 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Preparé las evidencias del Sprint 1 y el Sprint Planning del Sprint 2. | Iniciar el dashboard del médico con la vista de citas pendientes. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Hice el merge del Sprint 1 a develop y creé el tag v1.0.0. | Implementar el panel de administrador con gestión de usuarios aprobados. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Participé en el Sprint Planning del Sprint 2. | Crear el dashboard del paciente con el listado de médicos disponibles. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Participé en el Sprint Planning del Sprint 2. | Implementar el endpoint de disponibilidad de horarios del médico. | Ninguno. |

## Daily Scrum 8 — Martes 17 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Inicié la estructura del dashboard del médico. | Implementar la vista de citas pendientes ordenadas por fecha. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Implementé el endpoint PATCH /api/users/{id}/ para cambio de estado. | Implementar la vista de pacientes y médicos aprobados con opción de dar de baja. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Creé la estructura del dashboard del paciente con cards de médicos. | Implementar la búsqueda y filtro de médicos por especialidad. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Implementé el endpoint GET /api/doctors/{id}/disponibilidad/. | Crear el formulario de programación de citas con validaciones. | Ninguno. |

## Daily Scrum 9 — Miércoles 18 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Completé la lista de citas pendientes del médico ordenadas por fecha. | Implementar el flujo de atender paciente con registro de tratamiento. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Completé la vista de pacientes y médicos aprobados con opción de baja. | Implementar el endpoint de reportes administrativos. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Completé el filtro de médicos por especialidad en el dashboard. | Conectar el dashboard del paciente con el backend y verificar exclusión de médicos con cita. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Completé el formulario de programación de citas con validaciones de traslape. | Implementar la lista de citas activas y el historial del paciente. | Tuve problemas con la validación de traslapes, los resolví revisando la lógica del serializer. |

## Daily Scrum 10 — Jueves 19 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Implementé el flujo de atender paciente, incluyendo el formulario de tratamiento. | Implementar cancelación de cita por médico con envío de correo. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Completé el endpoint GET /api/admin/reportes/ con datos de médicos y especialidades. | Implementar el componente de reportes con gráficos (barras y doughnut). | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Conecté el dashboard del paciente, la exclusión de médicos con cita activa funciona. | Hacer pruebas completas del módulo del paciente. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Completé la lista de citas activas y el historial del paciente con estados. | Implementar la cancelación de citas por parte del paciente con confirmación. | Ninguno. |

## Daily Scrum 11 — Viernes 20 de marzo de 2026 — 8:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Implementé la cancelación de cita por médico con envío de correo automático al paciente. | Implementar la gestión de horarios del médico (establecer y actualizar). | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Completé los gráficos de reportes con Chart.js para el panel administrador. | Corregir el bug de approval_status APPROVED en registro (hotfix). | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Completé las pruebas del módulo del paciente, todo funciona correctamente. | Apoyar con pruebas del módulo del médico y documentación. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Completé la cancelación de citas del paciente con confirmación de diálogo. | Hacer pruebas de integración completas del módulo del paciente. | Ninguno. |

## Daily Scrum 12 — Sábado 21 de marzo de 2026 — 9:00 AM

| Integrante | Carnet | Rol | ¿Qué hice ayer? | ¿Qué haré hoy? | ¿Hay impedimentos? |
|-----------|--------|-----|-----------------|----------------|-------------------|
| Allan Josué Rafael Morales | 201709196 | Product Owner | Completé la gestión de horarios del médico con validación de citas activas. | Revisar y hacer merge de todas las ramas del Sprint 2 a develop. | Ninguno. |
| Roger Alberto Rivera Alvarez | 201800551 | Scrum Master | Apliqué el hotfix de approval_status y creé la rama hotfix/ApprovalStatusPending_201800551. | Generar documentación técnica completa y hacer merge del hotfix a main y develop. | Ninguno. |
| Wilmer Estuardo Vásquez Raxón | 201800678 | Developer | Apoyé con pruebas del módulo médico, todo funciona correctamente. | Preparar evidencias del Sprint 2 y participar en la retrospectiva. | Ninguno. |
| Anderson Gerardo Zuleta Galdámez | 201800500 | Developer | Completé las pruebas de integración del módulo del paciente. | Preparar evidencias del Sprint 2 y participar en la retrospectiva. | Ninguno. |
