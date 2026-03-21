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

