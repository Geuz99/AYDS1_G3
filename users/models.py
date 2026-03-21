from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Administrador")
        DOCTOR = "DOCTOR", _("Medico")
        PATIENT = "PATIENT", _("Paciente")

    class ApprovalStatus(models.TextChoices):
        PENDING = "PENDING", _("Pendiente")
        APPROVED = "APPROVED", _("Aprobado")
        REJECTED = "REJECTED", _("Rechazado")
        INACTIVE = "INACTIVE", _("Dado de Baja")

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.PATIENT,
        verbose_name=_("Rol"),
    )
    approval_status = models.CharField(
        max_length=10,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        verbose_name=_("Estado de aprobacion"),
    )
    # Hash para una segunda credencial del administrador (2FA basada en archivo).
    second_password_hash = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        verbose_name=_("Segunda contrasena encriptada"),
    )

    def set_second_password(self, raw_password: str) -> None:
        from django.contrib.auth.hashers import make_password

        self.second_password_hash = make_password(raw_password)

    def check_second_password(self, raw_password: str) -> bool:
        from django.contrib.auth.hashers import check_password

        if not self.second_password_hash:
            return False
        return check_password(raw_password, self.second_password_hash)


phone_validator = RegexValidator(
    regex=r"^\\+?[0-9]{8,15}$",
    message=_("Ingrese un telefono valido de 8 a 15 digitos, opcionalmente con +."),
)


dpi_validator = RegexValidator(
    regex=r"^[0-9]{13}$",
    message=_("El DPI debe contener exactamente 13 digitos numericos."),
)


class GenderChoices(models.TextChoices):
    MALE = "M", _("Masculino")
    FEMALE = "F", _("Femenino")
    OTHER = "O", _("Otro")


class Patient(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="patient_profile",
        verbose_name=_("Usuario"),
    )
    nombre = models.CharField(max_length=120)
    apellido = models.CharField(max_length=120)
    dpi = models.CharField(max_length=13, unique=True, validators=[dpi_validator])
    genero = models.CharField(max_length=1, choices=GenderChoices.choices)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15, validators=[phone_validator])
    fecha_nacimiento = models.DateField()
    correo_electronico = models.EmailField(unique=True)
    fotografia = models.ImageField(upload_to="patients/", blank=True, null=True)

    class Meta:
        verbose_name = _("Paciente")
        verbose_name_plural = _("Pacientes")

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellido}".strip()


class Doctor(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
        verbose_name=_("Usuario"),
    )
    nombre = models.CharField(max_length=120)
    apellido = models.CharField(max_length=120)
    dpi = models.CharField(max_length=13, unique=True, validators=[dpi_validator])
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=1, choices=GenderChoices.choices)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15, validators=[phone_validator])
    numero_colegiado = models.CharField(max_length=50, unique=True)
    especialidad = models.CharField(max_length=120)
    direccion_clinica = models.CharField(max_length=255)
    correo_electronico = models.EmailField(unique=True)
    fotografia = models.ImageField(upload_to="doctors/")

    class Meta:
        verbose_name = _("Medico")
        verbose_name_plural = _("Medicos")

    def __str__(self) -> str:
        return f"Dr. {self.nombre} {self.apellido}".strip()


class WeekDayChoices(models.TextChoices):
    MONDAY = "MON", _("Lunes")
    TUESDAY = "TUE", _("Martes")
    WEDNESDAY = "WED", _("Miercoles")
    THURSDAY = "THU", _("Jueves")
    FRIDAY = "FRI", _("Viernes")
    SATURDAY = "SAT", _("Sabado")
    SUNDAY = "SUN", _("Domingo")


class Horario(models.Model):
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="horarios",
        verbose_name=_("Medico"),
    )
    dias_semana = models.JSONField(
        default=list,
        help_text=_(
            "Lista de dias (MON..SUN). Todos los dias seleccionados comparten hora_inicio y hora_fin."
        ),
    )
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        verbose_name = _("Horario")
        verbose_name_plural = _("Horarios")
        constraints = [
            models.CheckConstraint(
                check=models.Q(hora_inicio__lt=models.F("hora_fin")),
                name="chk_horario_inicio_menor_fin",
            ),
        ]

    def clean(self):
        super().clean()

        if self.hora_inicio >= self.hora_fin:
            raise ValidationError({"hora_fin": _("La hora fin debe ser mayor que la hora inicio.")})

        if not isinstance(self.dias_semana, list) or not self.dias_semana:
            raise ValidationError({"dias_semana": _("Debe seleccionar al menos un dia.")})

        valid_days = {choice[0] for choice in WeekDayChoices.choices}
        normalized_days = [str(day).upper() for day in self.dias_semana]
        invalid_days = [day for day in normalized_days if day not in valid_days]

        if invalid_days:
            raise ValidationError(
                {"dias_semana": _("Hay dias invalidos en la seleccion: %(days)s") % {"days": ", ".join(invalid_days)}}
            )

        if len(set(normalized_days)) != len(normalized_days):
            raise ValidationError({"dias_semana": _("No se permiten dias repetidos en el horario.")})

        self.dias_semana = normalized_days

        overlapping_slots = Horario.objects.filter(doctor=self.doctor).exclude(pk=self.pk)
        current_days = set(self.dias_semana)

        for slot in overlapping_slots:
            slot_days = set((slot.dias_semana or []))
            has_day_intersection = bool(current_days.intersection(slot_days))
            has_time_overlap = self.hora_inicio < slot.hora_fin and self.hora_fin > slot.hora_inicio
            if has_day_intersection and has_time_overlap:
                raise ValidationError(
                    _(
                        "Existe traslape con otro horario del medico en los dias: %(days)s"
                    )
                    % {"days": ", ".join(sorted(current_days.intersection(slot_days)))}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        dias = ",".join(self.dias_semana)
        return f"{self.doctor} [{dias}] {self.hora_inicio}-{self.hora_fin}"


class CitaMedica(models.Model):
    class EstadoChoices(models.TextChoices):
        ACTIVA = "ACTIVA", _("Activa")
        ATENDIDA = "ATENDIDA", _("Atendida")
        CANCELADA_PACIENTE = "CANCELADA_PACIENTE", _("Cancelada por el paciente")
        CANCELADA_MEDICO = "CANCELADA_MEDICO", _("Cancelada por el medico")

    paciente = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="citas",
        verbose_name=_("Paciente"),
    )
    medico = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name="citas",
        verbose_name=_("Medico"),
    )
    fecha_cita = models.DateField()
    hora_cita = models.TimeField()
    motivo_cita = models.TextField()
    tratamiento = models.TextField(blank=True, null=True)
    estado = models.CharField(
        max_length=25,
        choices=EstadoChoices.choices,
        default=EstadoChoices.ACTIVA,
    )

    class Meta:
        verbose_name = _("Cita medica")
        verbose_name_plural = _("Citas medicas")
        ordering = ["fecha_cita", "hora_cita"]
        constraints = [
            # Restriccion de negocio: un paciente no puede tener dos citas en el mismo instante.
            models.UniqueConstraint(
                fields=["paciente", "fecha_cita", "hora_cita"],
                name="uq_cita_paciente_fecha_hora",
            ),
            # Restriccion adicional para evitar doble reserva simultanea del medico.
            models.UniqueConstraint(
                fields=["medico", "fecha_cita", "hora_cita"],
                name="uq_cita_medico_fecha_hora",
            ),
        ]
        indexes = [
            models.Index(fields=["medico", "fecha_cita", "hora_cita"], name="idx_cita_medico_fecha_hora"),
            models.Index(fields=["paciente", "fecha_cita", "hora_cita"], name="idx_cita_pac_fecha_hora"),
        ]

    def __str__(self) -> str:
        return f"{self.fecha_cita} {self.hora_cita} - {self.paciente} con {self.medico}"
