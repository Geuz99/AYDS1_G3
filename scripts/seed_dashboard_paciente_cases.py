from datetime import date, time, timedelta

from rest_framework.test import APIClient

from users.models import CitaMedica, Doctor, Horario, Patient, User


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def upsert_user(username, email, role, approval_status, password):
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "role": role,
            "approval_status": approval_status,
        },
    )

    changed = False
    if user.email != email:
        user.email = email
        changed = True
    if user.role != role:
        user.role = role
        changed = True
    if user.approval_status != approval_status:
        user.approval_status = approval_status
        changed = True

    user.set_password(password)
    user.save()

    if changed and not created:
        print(f"User actualizado: {username}")
    elif created:
        print(f"User creado: {username}")

    return user


def upsert_patient(user, nombre, apellido, dpi, correo):
    patient, _ = Patient.objects.update_or_create(
        user=user,
        defaults={
            "nombre": nombre,
            "apellido": apellido,
            "dpi": dpi,
            "genero": "M",
            "direccion": "Zona 1, Guatemala",
            "telefono": "12345678",
            "fecha_nacimiento": date(1990, 1, 1),
            "correo_electronico": correo,
        },
    )
    return patient


def upsert_doctor(user, idx, nombre, apellido, especialidad):
    doctor, _ = Doctor.objects.update_or_create(
        user=user,
        defaults={
            "nombre": nombre,
            "apellido": apellido,
            "dpi": f"1000000000{idx:03d}",
            "fecha_nacimiento": date(1985, 1, 1),
            "genero": "F" if idx % 2 == 0 else "M",
            "direccion": "Ciudad de Guatemala",
            "telefono": f"55{idx:06d}"[-8:],
            "numero_colegiado": f"COL-DASH-{idx:03d}",
            "especialidad": especialidad,
            "direccion_clinica": f"Clinica {idx}, Zona {idx % 25 + 1}",
            "correo_electronico": f"doctor_dashboard_{idx}@test.com",
            # Evita error por ImageField obligatorio usando ruta dummy.
            "fotografia": "doctors/default.jpg",
        },
    )
    return doctor


def upsert_cita(paciente, medico, estado, fecha_offset_days, hora, motivo):
    fecha_cita = date.today() + timedelta(days=fecha_offset_days)
    cita, _ = CitaMedica.objects.update_or_create(
        paciente=paciente,
        medico=medico,
        fecha_cita=fecha_cita,
        hora_cita=hora,
        defaults={
            "motivo_cita": motivo,
            "tratamiento": "",
            "estado": estado,
        },
    )
    return cita


def upsert_horario_semana(doctor, hora_inicio=time(8, 0), hora_fin=time(16, 0)):
    dias_laborales = ["MON", "TUE", "WED", "THU", "FRI"]
    Horario.objects.update_or_create(
        doctor=doctor,
        dias_semana=dias_laborales,
        defaults={
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
        },
    )


# -----------------------------------------------------------------------------
# Seed base users
# -----------------------------------------------------------------------------

print("\n=== Seed HU-05 Dashboard Paciente ===")

# Si existe el medico historico doctor1, tambien le asignamos horario para
# evitar que aparezca en dashboard sin disponibilidad.
legacy_doctor = Doctor.objects.filter(user__username="doctor1").first()
if legacy_doctor is not None:
    upsert_horario_semana(legacy_doctor)
    print("Horario asignado a doctor1 (legacy)")

patient_user = upsert_user(
    username="paciente_hu05",
    email="paciente_hu05@test.com",
    role=User.Role.PATIENT,
    approval_status=User.ApprovalStatus.APPROVED,
    password="PacienteHU05123!",
)

other_patient_user = upsert_user(
    username="paciente_hu05_otro",
    email="paciente_hu05_otro@test.com",
    role=User.Role.PATIENT,
    approval_status=User.ApprovalStatus.APPROVED,
    password="PacienteHU05123!",
)

patient = upsert_patient(
    user=patient_user,
    nombre="Paciente",
    apellido="HU05",
    dpi="5555555555555",
    correo="paciente_hu05@test.com",
)

other_patient = upsert_patient(
    user=other_patient_user,
    nombre="Otro",
    apellido="Paciente",
    dpi="6666666666666",
    correo="paciente_hu05_otro@test.com",
)

# -----------------------------------------------------------------------------
# Doctors for scenarios
# -----------------------------------------------------------------------------

# 1) Debe aparecer (aprobado, sin cita vigente con paciente_hu05)
doc_ok_user = upsert_user(
    username="doc_hu05_ok",
    email="doc_hu05_ok@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.APPROVED,
    password="DoctorHU05123!",
)
doc_ok = upsert_doctor(doc_ok_user, 1, "Ana", "Cardenas", "Cardiologia")
upsert_horario_semana(doc_ok)

# 2) Debe excluirse (cita ACTIVA con paciente_hu05)
doc_activa_user = upsert_user(
    username="doc_hu05_activa",
    email="doc_hu05_activa@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.APPROVED,
    password="DoctorHU05123!",
)
doc_activa = upsert_doctor(doc_activa_user, 2, "Bruno", "Lopez", "Dermatologia")
upsert_horario_semana(doc_activa)

# 3) Debe excluirse (cita PENDIENTE con paciente_hu05; edge/legacy)
doc_pend_user = upsert_user(
    username="doc_hu05_pendiente",
    email="doc_hu05_pendiente@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.APPROVED,
    password="DoctorHU05123!",
)
doc_pend = upsert_doctor(doc_pend_user, 3, "Carla", "Mendez", "Pediatria")
upsert_horario_semana(doc_pend)

# 4) Debe aparecer (cita ATENDIDA no es vigente)
doc_atendida_user = upsert_user(
    username="doc_hu05_atendida",
    email="doc_hu05_atendida@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.APPROVED,
    password="DoctorHU05123!",
)
doc_atendida = upsert_doctor(doc_atendida_user, 4, "Diego", "Ruiz", "Cardiologia")
upsert_horario_semana(doc_atendida)

# 5) Debe NO aparecer (REJECTED)
doc_rejected_user = upsert_user(
    username="doc_hu05_rejected",
    email="doc_hu05_rejected@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.REJECTED,
    password="DoctorHU05123!",
)
upsert_doctor(doc_rejected_user, 5, "Elena", "Soto", "Neurologia")

# 6) Debe NO aparecer (INACTIVE)
doc_inactive_user = upsert_user(
    username="doc_hu05_inactive",
    email="doc_hu05_inactive@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.INACTIVE,
    password="DoctorHU05123!",
)
upsert_doctor(doc_inactive_user, 6, "Fabian", "Guzman", "Traumatologia")

# 7) Debe aparecer para paciente_hu05 (la cita ACTIVA es de OTRO paciente)
doc_other_patient_user = upsert_user(
    username="doc_hu05_otro_paciente",
    email="doc_hu05_otro_paciente@test.com",
    role=User.Role.DOCTOR,
    approval_status=User.ApprovalStatus.APPROVED,
    password="DoctorHU05123!",
)
doc_other_patient = upsert_doctor(
    doc_other_patient_user,
    7,
    "Gabriela",
    "Perez",
    "Ginecologia",
)
upsert_horario_semana(doc_other_patient)

# -----------------------------------------------------------------------------
# Appointments to trigger edge cases
# -----------------------------------------------------------------------------

upsert_cita(
    paciente=patient,
    medico=doc_activa,
    estado=CitaMedica.EstadoChoices.ACTIVA,
    fecha_offset_days=3,
    hora="09:00",
    motivo="Control general",
)

# Estado legacy para probar exclusion por string "PENDIENTE" en dashboard.
upsert_cita(
    paciente=patient,
    medico=doc_pend,
    estado="PENDIENTE",
    fecha_offset_days=4,
    hora="10:00",
    motivo="Seguimiento",
)

upsert_cita(
    paciente=patient,
    medico=doc_atendida,
    estado=CitaMedica.EstadoChoices.ATENDIDA,
    fecha_offset_days=-7,
    hora="11:00",
    motivo="Consulta pasada",
)

upsert_cita(
    paciente=other_patient,
    medico=doc_other_patient,
    estado=CitaMedica.EstadoChoices.ACTIVA,
    fecha_offset_days=2,
    hora="08:00",
    motivo="Cita de otro paciente",
)

print("\nSeed completado.")
print("Paciente de prueba:")
print("  email: paciente_hu05@test.com")
print("  pass : PacienteHU05123!")

# -----------------------------------------------------------------------------
# Fetch real del endpoint para validar escenarios
# -----------------------------------------------------------------------------

client = APIClient()
client.force_authenticate(user=patient_user)

endpoint = "/api/pacientes/dashboard/medicos/"
res_all = client.get(endpoint)

print("\n=== Fetch dashboard (sin filtro) ===")
print(f"status: {res_all.status_code}")

if res_all.status_code == 200:
    payload = res_all.json()
    results = payload.get("results", [])
    print(f"count: {payload.get('count')}")
    for d in results:
        print(f"  - {d['nombre_completo']} | {d['especialidad']}")
else:
    print(res_all.content.decode("utf-8", errors="ignore"))

res_cardiologia = client.get(endpoint, {"especialidad": "Cardio"})
print("\n=== Fetch dashboard (?especialidad=Cardio) ===")
print(f"status: {res_cardiologia.status_code}")
if res_cardiologia.status_code == 200:
    payload = res_cardiologia.json()
    print(f"count: {payload.get('count')}")
    for d in payload.get("results", []):
        print(f"  - {d['nombre_completo']} | {d['especialidad']}")

print("\n=== Esperado para paciente_hu05 ===")
print("Incluidos: Ana Cardenas, Diego Ruiz, Gabriela Perez")
print("Excluidos por cita vigente: Bruno Lopez (ACTIVA), Carla Mendez (PENDIENTE)")
print("Excluidos por estado usuario: Elena Soto (REJECTED), Fabian Guzman (INACTIVE)")
