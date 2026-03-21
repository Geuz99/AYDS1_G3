from users.models import User, Patient, Doctor
from datetime import date

# Admin
admin, _ = User.objects.get_or_create(username="admin", defaults={
    "email": "admin@saludplus.local", "role": "ADMIN", "approval_status": "APPROVED"
})
admin.set_password("Admin12345!")
admin.set_second_password("Admin2FA789!")
admin.save()

# Paciente
user_p, _ = User.objects.get_or_create(username="paciente1", defaults={
    "email": "paciente1@test.com", "role": "PATIENT", "approval_status": "APPROVED"
})
user_p.set_password("Paciente123!")
user_p.save()
Patient.objects.get_or_create(user=user_p, defaults={
    "nombre": "Juan", "apellido": "Pérez", "dpi": "1234567890123",
    "genero": "M", "direccion": "Guatemala", "telefono": "12345678",
    "fecha_nacimiento": date(1990, 1, 1), "correo_electronico": "paciente1@test.com"
})
print("Datos de prueba creados correctamente")
