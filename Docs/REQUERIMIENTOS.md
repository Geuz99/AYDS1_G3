# Requerimientos — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

---

## Requerimientos Funcionales

### RF-01 — Registro de Paciente
El sistema debe permitir el registro de pacientes con los campos: nombre, apellido, DPI (13 dígitos), género, dirección, teléfono, fecha de nacimiento, correo electrónico, contraseña y fotografía opcional. La contraseña debe almacenarse encriptada con bcrypt.

### RF-02 — Registro de Médico
El sistema debe permitir el registro de médicos con los campos: nombre, apellido, DPI, fecha de nacimiento, género, dirección, teléfono, fotografía (obligatoria), número colegiado único, especialidad, dirección de clínica, correo y contraseña encriptada.

### RF-03 — Autenticación por Correo
El sistema debe autenticar a pacientes y médicos mediante correo electrónico y contraseña, generando tokens JWT con el rol del usuario.

### RF-04 — Autenticación 2FA del Administrador
El administrador debe pasar por dos fases de autenticación: primera con usuario y contraseña, segunda subiendo el archivo `auth2-ayd1.txt` cuyo contenido es validado contra un hash almacenado en la base de datos. Ambas contraseñas deben ser diferentes.

### RF-05 — Aprobación de Usuarios
El administrador debe poder aprobar o rechazar solicitudes de registro de pacientes y médicos. Solo los usuarios con estado APPROVED pueden iniciar sesión.

### RF-06 — Dashboard del Paciente
El sistema debe mostrar al paciente una lista de médicos aprobados disponibles (excluyendo aquellos con quienes ya tiene cita activa), con nombre, especialidad, dirección de clínica y fotografía.

### RF-07 — Búsqueda por Especialidad
El paciente debe poder filtrar médicos por especialidad mediante un campo de texto o selector.

### RF-08 — Visualización de Disponibilidad
Al seleccionar un médico, el paciente debe ver sus días y horarios de atención, y poder filtrar por fecha específica para ver los horarios ocupados y disponibles.

### RF-09 — Programación de Citas
El sistema debe permitir al paciente programar citas con: fecha, hora y motivo. Debe validar: disponibilidad del médico, no duplicidad de citas con el mismo médico, no traslapes con otras citas del paciente.

### RF-10 — Cancelación de Cita por Paciente
El paciente debe poder cancelar sus citas activas con confirmación previa. La cita cancelada debe liberar el horario.

### RF-11 — Lista de Citas Activas e Historial
El paciente debe ver sus citas activas (fecha, hora, médico, dirección, motivo) y su historial de citas atendidas y canceladas, incluyendo el tratamiento en citas atendidas.

### RF-12 — Gestión de Citas del Médico
El médico debe ver sus citas pendientes ordenadas por fecha, con nombre del paciente y motivo.

### RF-13 — Atención de Paciente
El médico debe poder marcar una cita como ATENDIDA ingresando obligatoriamente el tratamiento. La cita atendida debe desaparecer de la lista de pendientes.

### RF-14 — Cancelación de Cita por Médico
El médico debe poder cancelar citas con confirmación, y el sistema debe enviar automáticamente un correo al paciente con: fecha, hora, motivo y mensaje de disculpa.

### RF-15 — Gestión de Horarios del Médico
El médico debe poder establecer y actualizar sus horarios de atención (días y rango horario). El sistema debe validar que no existan citas activas fuera del nuevo rango antes de permitir la actualización.

### RF-16 — Ver y Actualizar Perfil
Pacientes y médicos deben poder visualizar y modificar sus datos de perfil, excepto el correo electrónico.

### RF-17 — Dar de Baja Usuarios
El administrador debe poder dar de baja a pacientes y médicos. Los usuarios dados de baja no pueden iniciar sesión.

### RF-18 — Reportes Administrativos
El sistema debe generar al menos dos reportes: (1) médicos con más pacientes atendidos con gráfico de barras, (2) especialidades con más citas generadas con gráfico visual.

---

## Requerimientos No Funcionales

### RNF-01 — Seguridad
Las contraseñas deben almacenarse encriptadas con el algoritmo bcrypt (Django's PBKDF2). Los tokens JWT deben incluir el rol del usuario y tener tiempo de expiración configurado.

### RNF-02 — Rendimiento
El sistema debe responder a las solicitudes de la API en menos de 2 segundos bajo condiciones normales de uso.

### RNF-03 — Disponibilidad
La aplicación debe poder levantarse completamente con un solo comando (`docker compose up`) sin configuración manual adicional.

### RNF-04 — Portabilidad
El sistema debe estar completamente contenedorizado con Docker (frontend, backend y base de datos), garantizando consistencia entre entornos de desarrollo y producción.

### RNF-05 — Mantenibilidad
El código debe seguir el estándar de Conventional Commits y estar organizado según Git Flow con ramas `main`, `develop`, `feature/*`, `hotfix/*` y `release/*`.

### RNF-06 — Usabilidad
La interfaz debe ser responsive y clara, con mensajes de error específicos que indiquen el motivo del problema al usuario.

### RNF-07 — Base de Datos
Se utiliza PostgreSQL 15 como sistema de gestión de base de datos relacional. Las migraciones deben ejecutarse automáticamente al iniciar el contenedor.

### RNF-08 — Escalabilidad
La arquitectura debe separar claramente frontend (Next.js), backend (Django REST Framework) y base de datos en contenedores independientes que puedan escalar de forma individual.
