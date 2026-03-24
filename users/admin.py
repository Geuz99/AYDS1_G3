from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CitaMedica, Doctor, Horario, Patient, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "approval_status", "is_staff")
    list_filter = ("role", "approval_status", "is_staff", "is_superuser")
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "SaludPlus",
            {
                "fields": ("role", "approval_status", "second_password_hash"),
            },
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "SaludPlus",
            {
                "fields": ("role", "approval_status"),
            },
        ),
    )


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("nombre", "apellido", "dpi", "correo_electronico", "telefono")
    search_fields = ("nombre", "apellido", "dpi", "correo_electronico")


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "apellido",
        "numero_colegiado",
        "especialidad",
        "correo_electronico",
    )
    search_fields = (
        "nombre",
        "apellido",
        "dpi",
        "numero_colegiado",
        "especialidad",
        "correo_electronico",
    )


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = ("doctor", "dias_semana", "hora_inicio", "hora_fin")
    list_filter = ("doctor",)
    search_fields = ("doctor__nombre", "doctor__apellido", "doctor__numero_colegiado")


@admin.register(CitaMedica)
class CitaMedicaAdmin(admin.ModelAdmin):
    list_display = ("fecha_cita", "hora_cita", "paciente", "medico", "estado")
    list_filter = ("estado", "fecha_cita", "medico")
    search_fields = (
        "paciente__nombre",
        "paciente__apellido",
        "medico__nombre",
        "medico__apellido",
        "motivo_cita",
    )
