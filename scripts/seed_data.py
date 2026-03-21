from users.models import User, Patient, Doctor
from datetime import date

# Admin
admin, _ = User.objects.get_or_create(username="admin", defaults={
    "email": "admin@saludplus.local", "role": "ADMIN", "approval_status": "APPROVED"
})
admin.set_password("Admin12345!")
admin.set_second_password("Admin2FA789!")
admin.save()
print("Admin creado/actualizado")

# Paciente
user_p, _ = User.objects.get_or_create(username="paciente1", defaults={
    "email": "paciente1@test.com", "role": "PATIENT", "approval_status": "APPROVED"
})
user_p.set_password("Paciente123!")
user_p.save()
Patient.objects.get_or_create(user=user_p, defaults={
    "nombre": "Juan", "apellido": "Pérez", "dpi": "1234567890123",
    "genero": "M", "direccion": "Ciudad de Guatemala", "telefono": "12345678",
    "fecha_nacimiento": date(1990, 1, 1), "correo_electronico": "paciente1@test.com"
})
print("Paciente creado/actualizado")

# Médico
user_d, _ = User.objects.get_or_create(username="doctor1", defaults={
    "email": "doctor1@test.com", "role": "DOCTOR", "approval_status": "APPROVED"
})
user_d.set_password("Doctor123!")
user_d.save()
Doctor.objects.get_or_create(user=user_d, defaults={
    "nombre": "María", "apellido": "González", "dpi": "9876543210123",
    "fecha_nacimiento": date(1985, 6, 15), "genero": "F",
    "direccion": "Zona 10, Guatemala", "telefono": "87654321",
    "numero_colegiado": "COL-001", "especialidad": "Medicina General",
    "direccion_clinica": "Clínica Central, Zona 1",
    "correo_electronico": "doctor1@test.com",
    "fotografia": ""
})
print("Médico creado/actualizado")

print("\nDatos de prueba listos. Usuarios disponibles:")
print("  Admin:    admin@saludplus.local  / Admin12345!  (2FA: Admin2FA789!)")
print("  Paciente: paciente1@test.com     / Paciente123!")
print("  Médico:   doctor1@test.com       / Doctor123!")