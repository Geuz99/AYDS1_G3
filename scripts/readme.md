# Scripts de utilidad

## seed_data.py — Datos de prueba

Crea usuarios de prueba para desarrollo local. Incluye un administrador, un paciente aprobado y un médico aprobado.

### Uso

```bash
docker compose exec api python manage.py shell < scripts/seed_data.py
```

### Usuarios que crea

| Rol | Email | Contraseña | Estado |
|-----|-------|-----------|--------|
| Administrador | admin@saludplus.local | Admin12345! | Aprobado |
| Paciente | paciente1@test.com | Paciente123! | Aprobado |
| Médico | doctor1@test.com | Doctor123! | Aprobado |

### Segunda contraseña del administrador (2FA)

El administrador requiere una segunda autenticación con el archivo `auth2-ayd1.txt`.

1. Crea un archivo de texto llamado exactamente `auth2-ayd1.txt`
2. Escribe dentro: `Admin2FA789!`
3. Súbelo en la pantalla de verificación (`/admin-2fa`)

---

## seed_dashboard_paciente_cases.py — Casos HU-05 Dashboard Paciente

Genera datos de prueba orientados a la HU-05, incluyendo casos normales y edge cases para validar filtros de médicos disponibles, exclusiones por citas vigentes y búsqueda por especialidad.

### Uso

```bash
docker compose exec -T api python manage.py shell -c "exec(open('scripts/seed_dashboard_paciente_cases.py').read())"
```

### Credenciales de pacientes (HU-05)

| Rol | Username | Email | Contraseña | Estado |
|-----|----------|-------|------------|--------|
| Paciente | paciente_hu05 | paciente_hu05@test.com | PacienteHU05123! | APPROVED |
| Paciente (secundario) | paciente_hu05_otro | paciente_hu05_otro@test.com | PacienteHU05123! | APPROVED |

### Credenciales de médicos (HU-05)

Todos los médicos HU-05 usan la misma contraseña: `DoctorHU05123!`.

| Username | Email | Nombre | Especialidad | Estado | Caso esperado en dashboard de `paciente_hu05` |
|----------|-------|--------|--------------|--------|-----------------------------------------------|
| doc_hu05_ok | doc_hu05_ok@test.com | Ana Cardenas | Cardiologia | APPROVED | Aparece |
| doc_hu05_activa | doc_hu05_activa@test.com | Bruno Lopez | Dermatologia | APPROVED | No aparece (cita ACTIVA con paciente_hu05) |
| doc_hu05_pendiente | doc_hu05_pendiente@test.com | Carla Mendez | Pediatria | APPROVED | No aparece (cita PENDIENTE con paciente_hu05) |
| doc_hu05_atendida | doc_hu05_atendida@test.com | Diego Ruiz | Cardiologia | APPROVED | Aparece (cita ATENDIDA no vigente) |
| doc_hu05_rejected | doc_hu05_rejected@test.com | Elena Soto | Neurologia | REJECTED | No aparece |
| doc_hu05_inactive | doc_hu05_inactive@test.com | Fabian Guzman | Traumatologia | INACTIVE | No aparece |
| doc_hu05_otro_paciente | doc_hu05_otro_paciente@test.com | Gabriela Perez | Ginecologia | APPROVED | Aparece (cita ACTIVA con otro paciente) |

### Médico legacy del seed base

Si existe el usuario `doctor1` (del `seed_data.py`), este script le asigna horario laboral para evitar que aparezca sin disponibilidad.

| Username | Email | Contraseña | Estado |
|----------|-------|------------|--------|
| doctor1 | doctor1@test.com | Doctor123! | APPROVED |

### Horarios creados por este script

- Para médicos HU-05 visibles en pruebas: Lunes a Viernes (`MON..FRI`), de `08:00` a `16:00`.
- Para `doctor1`, solo si existe: también `MON..FRI`, de `08:00` a `16:00`.

### Qué valida automáticamente al ejecutarlo

1. Hace fetch a `/api/pacientes/dashboard/medicos/` autenticando como `paciente_hu05`.
2. Hace fetch a `/api/pacientes/dashboard/medicos/?especialidad=Cardio`.
3. Imprime en consola el conteo y los médicos devueltos para comparar con el esperado.

