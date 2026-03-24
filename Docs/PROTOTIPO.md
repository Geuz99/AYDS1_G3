# Prototipos de Interfaces — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

---

## Resumen de Módulos

| Módulo | Pantallas |
|--------|-----------|
| Acceso al sistema | Pantalla principal, Login, 2FA, Registro |
| Administrador | Dashboard, Pendientes, Aprobados, Reportes, Perfil |
| Médico | Panel de citas, Calendario, Horarios, Perfil |
| Paciente | Dashboard, Agendar cita, Mis citas, Perfil |

---

## Módulo 1 — Acceso al Sistema

### Pantalla Principal

Página de bienvenida con información general de la plataforma, estadísticas y accesos directos a login y registro.

![Pantalla principal](imagenes/Pantalla_principal.png)

---

### Login

Formulario de autenticación unificado para los tres roles. El sistema redirige automáticamente al dashboard correspondiente según el rol del usuario autenticado.

![Login](imagenes/login.png)

---

### Verificación 2FA — Administrador

Segunda capa de autenticación exclusiva del administrador. Requiere subir el archivo `auth2-ayd1.txt` con la contraseña de segundo factor.

![2FA Administrador](imagenes/2-FA.png)

---

### Registro de Usuario

Formulario de registro para pacientes con validaciones en tiempo real: formato DPI, teléfono guatemalteco, edad mínima y complejidad de contraseña.

![Registro de paciente](imagenes/Registro.png)

---

## Módulo 2 — Administrador

### Dashboard Principal

Panel de control con 6 tarjetas de acceso rápido. Los puntos rojos indican elementos que requieren atención inmediata.

![Dashboard administrador](imagenes/admin_dashboard.png)

---

### Pacientes Pendientes

Listado de solicitudes de registro de pacientes con todos sus datos personales. Permite aprobar o rechazar cada solicitud individualmente.

![Pacientes pendientes](imagenes/pascientes_pendientes_admin.png)

---

### Médicos Pendientes

Revisión de solicitudes de registro de médicos con datos profesionales (especialidad, número colegiado, dirección de clínica). Permite aprobar o rechazar.

![Médicos pendientes](imagenes/medicos_pendientes_admin.png)

---

### Pacientes Aprobados

Listado de pacientes activos con tarjetas expandibles que muestran todos los datos del perfil. Incluye opción de dar de baja.

![Pacientes aprobados](imagenes/listado_pascientes_aprobados.png)

---

### Médicos Aprobados

Listado de médicos activos con información profesional completa expandible. Incluye ambos correos (usuario y clínica) y opción de dar de baja.

![Médicos aprobados](imagenes/listado_medicos_aprobados.png)

---

### Reportes Estadísticos

Panel analítico con métricas resumen y dos gráficas: barras para médicos más activos y dona para distribución de citas por especialidad.

![Reportes](imagenes/reportes.png)

---

### Perfil del Administrador

Vista de datos de la cuenta con formularios para cambiar la contraseña principal y la contraseña 2FA de forma independiente.

![Perfil administrador](imagenes/perfil_admin.png)

---

## Módulo 3 — Médico

### Panel de Citas

Vista principal del médico con lista de citas pendientes del día y calendario mensual. Cada cita tiene botones de acción directa: Atender y Cancelar.

![Panel de citas médico](imagenes/citas_doctor.png)

---

### Calendario de Citas

Vista mensual interactiva con agenda diaria hora por hora. El día actual aparece resaltado. Muestra el estado de cada franja horaria.

![Calendario médico](imagenes/dashboard_doctor.png)

---

### Gestión de Horarios

Formulario para definir días de atención y rango horario. Los horarios configurados se publican de inmediato y son visibles para los pacientes al agendar.

![Gestión de horarios](imagenes/gestion_horario_medico.png)

---

### Perfil del Médico

Vista de datos profesionales completos: especialidad, número colegiado, dirección de clínica, correos y estado de cuenta. Permite cambiar contraseña.

![Perfil médico](imagenes/perfil_medico.png)

---

## Módulo 4 — Paciente

### Dashboard del Paciente

Panel personalizado con accesos directos, contadores de citas por estado y vista de la próxima cita programada con datos del médico asignado.

![Dashboard paciente](imagenes/dahsboard_pasciente.png)

---

### Agendar Cita — Selección de Médico

Catálogo de médicos disponibles con tarjetas que muestran especialidad, clínica y teléfono. Incluye buscador por nombre y filtro por especialidad.

![Selección de médico](imagenes/agendar_cita.png)

---

### Agendar Cita — Confirmación

Formulario de confirmación con selector de fecha, horarios disponibles cargados dinámicamente y campo de motivo de consulta.

![Formulario de cita](imagenes/form_programar_cita.png)

---

### Mis Citas Médicas

Vista dividida en dos columnas: citas activas con opción de cancelación e historial completo con diagnósticos y tratamientos registrados por el médico.

![Mis citas](imagenes/mis_cintas.png)

---

### Perfil del Paciente

Vista de datos personales completos con opción de edición. Muestra nombre, DPI, fecha de nacimiento, género, teléfono, correo y dirección.

![Perfil paciente](imagenes/perfil.png)

---

## Resumen de Pantallas por Módulo

| # | Módulo | Pantalla | Imagen |
|---|--------|----------|--------|
| 1 | Acceso | Pantalla principal | Pantalla_principal.png |
| 2 | Acceso | Login | login.png |
| 3 | Acceso | Verificación 2FA | 2-FA.png |
| 4 | Acceso | Registro de paciente | Registro.png |
| 5 | Administrador | Dashboard | admin_dashboard.png |
| 6 | Administrador | Pacientes pendientes | pascientes_pendientes_admin.png |
| 7 | Administrador | Médicos pendientes | medicos_pendientes_admin.png |
| 8 | Administrador | Pacientes aprobados | listado_pascientes_aprobados.png |
| 9 | Administrador | Médicos aprobados | listado_medicos_aprobados.png |
| 10 | Administrador | Reportes | reportes.png |
| 11 | Administrador | Perfil | perfil_admin.png |
| 12 | Médico | Panel de citas | citas_doctor.png |
| 13 | Médico | Calendario | dashboard_doctor.png |
| 14 | Médico | Gestión de horarios | gestion_horario_medico.png |
| 15 | Médico | Perfil | perfil_medico.png |
| 16 | Paciente | Dashboard | dahsboard_pasciente.png |
| 17 | Paciente | Agendar cita — médico | agendar_cita.png |
| 18 | Paciente | Agendar cita — formulario | form_programar_cita.png |
| 19 | Paciente | Mis citas | mis_cintas.png |
| 20 | Paciente | Perfil | perfil.png |

**Total: 20 pantallas — 4 módulos completos cubiertos**