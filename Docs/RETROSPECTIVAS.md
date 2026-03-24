# Retrospectivas — SaludPlus
**Proyecto:** SaludPlus — Plataforma de Gestión de Citas Médicas  
**Curso:** Análisis y Diseño de Sistemas 1 — USAC FIUSAC  
**Grupo:** 3  

---

# Sprint Retrospective 1 — 15 de marzo de 2026

**Fecha:** Sábado 15 de marzo de 2026 — 10:00 AM  
**Modalidad:** Google Meet (grabación disponible en Drive)

---

## Allan Josué Rafael Morales — 201709196 — Product Owner

**¿Qué se hizo bien durante el Sprint?**  
Logramos configurar el ambiente de desarrollo con Docker de forma rápida, lo que permitió que todo el equipo trabajara en el mismo entorno sin problemas de compatibilidad. La comunicación del equipo fue fluida y los dailies ayudaron a identificar bloqueos a tiempo.

**¿Qué se hizo mal durante el Sprint?**  
Al inicio tuve problemas con la versión de Node en el contenedor del frontend, lo que retrasó un día la integración. También algunos commits no siguieron completamente el estándar de Conventional Commits.

**¿Qué mejoras se deben implementar?**  
Revisar las versiones de las dependencias antes de iniciar el sprint. Establecer una checklist de Conventional Commits para que todos la sigan consistentemente.

---

## Roger Alberto Rivera Alvarez — 201800551 — Scrum Master

**¿Qué se hizo bien durante el Sprint?**  
El equipo completó todas las historias comprometidas en el Sprint Planning. El flujo de Git con ramas feature por integrante funcionó bien. La autenticación con JWT y el 2FA del administrador quedaron robustos desde el primer sprint.

**¿Qué se hizo mal durante el Sprint?**  
El bug de approval_status (APPROVED en lugar de PENDING) no fue detectado hasta el Sprint 2, lo que significa que las pruebas del flujo de aprobación fueron insuficientes en este sprint.

**¿Qué mejoras se deben implementar?**  
Agregar pruebas más completas del flujo de registro y aprobación antes de hacer merge. Definir casos de prueba específicos para cada historia de usuario.

---

## Wilmer Estuardo Vásquez Raxón — 201800678 — Developer

**¿Qué se hizo bien durante el Sprint?**  
El formulario de registro de paciente quedó con todas las validaciones correctas desde el primer intento. La encriptación de contraseñas y la validación de correos duplicados funcionan perfectamente.

**¿Qué se hizo mal durante el Sprint?**  
Tardé en reportar las dudas sobre el formato del DPI, lo que generó un pequeño retraso. Podría haber escalado la pregunta más rápido en el daily.

**¿Qué mejoras se deben implementar?**  
Comunicar dudas más rápidamente en los dailies en lugar de resolverlas de forma solitaria. Documentar las decisiones de validación para que todo el equipo las conozca.

---

## Anderson Gerardo Zuleta Galdámez — 201800500 — Developer

**¿Qué se hizo bien durante el Sprint?**  
La configuración de Docker quedó lista desde el primer día, permitiendo que el equipo trabajara sin problemas de entorno. El archivo .env.example facilita mucho la configuración inicial.

**¿Qué se hizo mal durante el Sprint?**  
El problema con el puerto 5432 ocupado retrasó el inicio del trabajo en la base de datos. Debí haber verificado los puertos disponibles antes de iniciar.

**¿Qué mejoras se deben implementar?**  
Documentar mejor el proceso de setup en el README para evitar problemas similares a futuros contribuidores. Verificar puertos disponibles como parte del checklist inicial.

---

# Sprint Retrospective 2 — 22 de marzo de 2026

**Fecha:** Domingo 22 de marzo de 2026 — 10:00 AM  
**Modalidad:** Google Meet (grabación disponible en Drive)

---

## Allan Josué Rafael Morales — 201709196 — Product Owner

**¿Qué se hizo bien durante el Sprint?**  
El módulo del médico quedó completo con todas las funcionalidades: gestión de citas, atención de pacientes, cancelación con correo automático y gestión de horarios. El calendario de citas es intuitivo y funcional.

**¿Qué se hizo mal durante el Sprint?**  
Tuve algunos conflictos de merge al integrar mis ramas con develop, lo que generó retrasos de un día. La gestión de ramas puede mejorar.

**¿Qué mejoras se deben implementar?**  
Hacer pull de develop más frecuentemente para reducir conflictos de merge. Comunicar al equipo cuando se van a mergear cambios grandes para coordinar mejor.

---

## Roger Alberto Rivera Alvarez — 201800551 — Scrum Master

**¿Qué se hizo bien durante el Sprint?**  
El panel de administrador quedó muy completo con cards expandibles, reportes con Chart.js, gestión de dados de baja y perfil editable. El hotfix fue manejado correctamente siguiendo Git Flow.

**¿Qué se hizo mal durante el Sprint?**  
La acumulación de cambios en la rama Feature/Reportes generó muchos conflictos al hacer merge. Debí hacer merges parciales más frecuentes.

**¿Qué mejoras se deben implementar?**  
Hacer merges a develop cada 2-3 días en lugar de acumular cambios de una semana. Usar ramas más pequeñas y específicas por funcionalidad.

---

## Wilmer Estuardo Vásquez Raxón — 201800678 — Developer

**¿Qué se hizo bien durante el Sprint?**  
El dashboard del paciente quedó completo y bien integrado con el backend. La exclusión de médicos con cita activa funciona correctamente y la búsqueda por especialidad es fluida.

**¿Qué se hizo mal durante el Sprint?**  
No actualicé el estado de mis tareas en el tablero Kanban con la misma frecuencia que avanzaba en el código, lo que generó confusión sobre el progreso real.

**¿Qué mejoras se deben implementar?**  
Actualizar el tablero Kanban al inicio y al final de cada jornada de trabajo. Mover las tarjetas a TEST/QA cuando el código está listo para revisión.

---

## Anderson Gerardo Zuleta Galdámez — 201800500 — Developer

**¿Qué se hizo bien durante el Sprint?**  
Las validaciones de programación de citas son muy robustas: traslapes, disponibilidad, duplicados. El historial del paciente muestra claramente el estado y el tratamiento de cada cita.

**¿Qué se hizo mal durante el Sprint?**  
El problema con las validaciones de traslapes me tomó más tiempo del esperado, afectando el calendario del sprint. Debí haber pedido apoyo antes.

**¿Qué mejoras se deben implementar?**  
Escalar los bloqueos técnicos más rápidamente al Scrum Master en lugar de trabajar en ellos de forma solitaria por más de un día. Escribir pruebas unitarias desde el inicio para detectar bugs antes.
