# Product Backlog — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

---

## Product Backlog

| ID | Historia de Usuario | Prioridad | Estimación (SP) | Sprint | Estado |
|----|--------------------|-----------|-----------------|----|--------|
| HU-01 | Registro de Paciente | Alta | 3 | 1 | ✅ Done |
| HU-02 | Autenticación de Usuarios | Alta | 5 | 1 | ✅ Done |
| HU-03 | Aprobación de Usuarios (Admin) | Alta | 5 | 1 | ✅ Done |
| HU-04 | Registro de Médico | Alta | 3 | 1 | ✅ Done |
| HU-05 | Dashboard del Paciente | Alta | 5 | 2 | ✅ Done |
| HU-06 | Ver Horarios y Programar Cita | Alta | 8 | 2 | ✅ Done |
| HU-07 | Gestión de Citas del Paciente | Alta | 5 | 2 | ✅ Done |
| HU-08 | Módulo Médico — Gestión de Citas | Alta | 5 | 2 | ✅ Done |
| HU-09 | Gestión de Horarios del Médico | Alta | 5 | 2 | ✅ Done |
| HU-10 | Módulo Admin — Gestión y Reportes | Alta | 5 | 2 | ✅ Done |
| HU-11 | Documentación y Cierre | Media | 8 | 2 |✅ Done 

**Total Story Points:** 57  
**Sprint 1:** 16 SP | **Sprint 2:** 41 SP

---

## Sprint 1 Backlog — 9 al 15 de marzo de 2026

| Tarea | Responsable | HU | Estado |
|-------|-------------|-----|--------|
| Configurar Docker (backend + frontend + DB) | Anderson (201800500) | HU-04 | ✅ Done |
| Implementar modelos de BD (User, Patient, Doctor, Horario, CitaMedica) | Roger (201800551) | HU-01 | ✅ Done |
| Serializer de login por email con SimpleJWT | Roger (201800551) | HU-02 | ✅ Done |
| Endpoint 2FA administrador con archivo auth2-ayd1.txt | Roger (201800551) | HU-02 | ✅ Done |
| Formulario de registro de paciente con validaciones | Wilmer (201800678) | HU-01 | ✅ Done |
| Formulario de registro de médico con fotografía obligatoria | Anderson (201800500) | HU-04 | ✅ Done |
| Páginas de login y 2FA en Next.js | Roger (201800551) | HU-02 | ✅ Done |
| Navbar dinámico y dashboards por rol | Allan (201709196) | HU-02 | ✅ Done |
| Panel de aprobación de usuarios (admin) | Roger (201800551) | HU-03 | ✅ Done |

---

## Sprint 2 Backlog — 16 al 22 de marzo de 2026

| Tarea | Responsable | HU | Estado |
|-------|-------------|-----|--------|
| Dashboard paciente con listado de médicos | Wilmer (201800678) | HU-05 | ✅ Done |
| Búsqueda por especialidad | Wilmer (201800678) | HU-05 | ✅ Done |
| Endpoint disponibilidad de médico por fecha | Anderson (201800500) | HU-06 | ✅ Done |
| Formulario de programación de citas con validaciones | Anderson (201800500) | HU-06 | ✅ Done |
| Lista de citas activas e historial del paciente | Anderson (201800500) | HU-07 | ✅ Done |
| Cancelación de cita por paciente | Anderson (201800500) | HU-07 | ✅ Done |
| Dashboard del médico con calendario de citas | Allan (201709196) | HU-08 | ✅ Done |
| Atender paciente con registro de tratamiento | Allan (201709196) | HU-08 | ✅ Done |
| Cancelar cita + envío de correo al paciente | Allan (201709196) | HU-08 | ✅ Done |
| Gestión de horarios del médico (establecer y actualizar) | Allan (201709196) | HU-09 | ✅ Done |
| Panel admin: ver aprobados y dar de baja | Roger (201800551) | HU-10 | ✅ Done |
| Reportes con gráficos (barras y doughnut) | Roger (201800551) | HU-10 | ✅ Done |
| Hotfix: approval_status PENDING en registro | Roger (201800551) | HU-03 | ✅ Done |
| Documentación técnica completa | Roger (201800551) | HU-11 | ✅ Done 
| Manual de usuario por rol | Roger (201800551) | HU-11 | ✅ Done 
