import re
from datetime import date

from django.db import transaction
from rest_framework import serializers

from .models import CitaMedica, Doctor, Horario, Patient, User, WeekDayChoices


LOCAL_PHONE_REGEX = re.compile(r"^(?:\+502)?[0-9]{8}$")
LOCAL_DPI_REGEX = re.compile(r"^[0-9]{13}$")
PASSWORD_LOWER_REGEX = re.compile(r"[a-z]")
PASSWORD_UPPER_REGEX = re.compile(r"[A-Z]")
PASSWORD_DIGIT_REGEX = re.compile(r"[0-9]")
MINIMUM_AGE = 18
WEEKDAY_INDEX_TO_CODE = {
    0: WeekDayChoices.MONDAY,
    1: WeekDayChoices.TUESDAY,
    2: WeekDayChoices.WEDNESDAY,
    3: WeekDayChoices.THURSDAY,
    4: WeekDayChoices.FRIDAY,
    5: WeekDayChoices.SATURDAY,
    6: WeekDayChoices.SUNDAY,
}


def _validate_minimum_age(value):
    today = date.today()
    age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
    if age < MINIMUM_AGE:
        raise serializers.ValidationError(
            f"La edad minima permitida es de {MINIMUM_AGE} años."
        )
    return value


def _normalize_phone(value):
    normalized = value.replace(" ", "").replace("-", "")
    if not LOCAL_PHONE_REGEX.match(normalized):
        raise serializers.ValidationError(
            "Telefono invalido. Use 8 digitos o formato +502XXXXXXXX."
        )
    return normalized


def _validate_dpi(value):
    if not LOCAL_DPI_REGEX.match(value):
        raise serializers.ValidationError("El DPI debe contener exactamente 13 digitos.")
    return value


def _validate_password_complexity(value):
    if len(value) < 8:
        raise serializers.ValidationError("La contrasena debe tener al menos 8 caracteres.")
    if not PASSWORD_LOWER_REGEX.search(value):
        raise serializers.ValidationError("La contrasena debe incluir al menos 1 letra minuscula.")
    if not PASSWORD_UPPER_REGEX.search(value):
        raise serializers.ValidationError("La contrasena debe incluir al menos 1 letra mayuscula.")
    if not PASSWORD_DIGIT_REGEX.search(value):
        raise serializers.ValidationError("La contrasena debe incluir al menos 1 numero.")
    return value


def _generate_unique_username_from_email(email):
    base = (email.split("@")[0] or "paciente").lower()
    candidate = re.sub(r"[^a-z0-9._-]", "", base)[:30] or "paciente"

    if not User.objects.filter(username=candidate).exists():
        return candidate

    suffix = 1
    while True:
        generated = f"{candidate}_{suffix}"
        if not User.objects.filter(username=generated).exists():
            return generated
        suffix += 1


def _validate_cross_email_uniqueness(email, instance=None):
    patient_qs = Patient.objects.filter(correo_electronico__iexact=email)
    doctor_qs = Doctor.objects.filter(correo_electronico__iexact=email)
    user_qs = User.objects.filter(email__iexact=email)

    if instance is not None and isinstance(instance, Patient):
        patient_qs = patient_qs.exclude(pk=instance.pk)
        if instance.user_id:
            user_qs = user_qs.exclude(pk=instance.user_id)
    if instance is not None and isinstance(instance, Doctor):
        doctor_qs = doctor_qs.exclude(pk=instance.pk)
        if instance.user_id:
            user_qs = user_qs.exclude(pk=instance.user_id)

    if patient_qs.exists():
        raise serializers.ValidationError(
            "Este correo ya esta registrado en el perfil de un paciente."
        )
    if doctor_qs.exists():
        raise serializers.ValidationError(
            "Este correo ya esta registrado en el perfil de un medico."
        )
    if user_qs.exists():
        raise serializers.ValidationError(
            "Este correo ya esta registrado como email de usuario."
        )
    return email


def _find_matching_horario(doctor, fecha_cita, hora_cita):
    day_code = WEEKDAY_INDEX_TO_CODE[fecha_cita.weekday()]
    horarios = Horario.objects.filter(doctor=doctor)

    for horario in horarios:
        dias = horario.dias_semana or []
        within_day = day_code in dias
        within_hour = horario.hora_inicio <= hora_cita < horario.hora_fin
        if within_day and within_hour:
            return horario

    return None


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "approval_status")
        read_only_fields = ("id", "role", "approval_status")


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = "__all__"
        read_only_fields = ("id", "user")

    def validate_fecha_nacimiento(self, value):
        return _validate_minimum_age(value)

    def validate_telefono(self, value):
        return _normalize_phone(value)

    def validate_dpi(self, value):
        return _validate_dpi(value)

    def validate_correo_electronico(self, value):
        return _validate_cross_email_uniqueness(value, instance=self.instance)


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = "__all__"
        read_only_fields = ("id", "user")

    def validate_fecha_nacimiento(self, value):
        return _validate_minimum_age(value)

    def validate_telefono(self, value):
        return _normalize_phone(value)

    def validate_dpi(self, value):
        return _validate_dpi(value)

    def validate_correo_electronico(self, value):
        return _validate_cross_email_uniqueness(value, instance=self.instance)

    def update(self, instance, validated_data):
        old_photo_name = instance.fotografia.name if instance.fotografia else None
        updated_instance = super().update(instance, validated_data)

        new_photo_name = updated_instance.fotografia.name if updated_instance.fotografia else None
        if old_photo_name and old_photo_name != new_photo_name:
            instance.fotografia.storage.delete(old_photo_name)

        return updated_instance


class HorarioSerializer(serializers.ModelSerializer):
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(),
        required=False,
    )

    class Meta:
        model = Horario
        fields = "__all__"
        read_only_fields = ("id",)


class CitaMedicaSerializer(serializers.ModelSerializer):

    class Meta:
        model = CitaMedica
        fields = "__all__"
        read_only_fields = ("id",)
        extra_kwargs = {
            # paciente es opcional en el payload: perform_create lo inyecta
            # automaticamente desde el JWT para rol PATIENT.
            # required=False + default=None = campo genuinamente omisible.
            # Sin default, DRF lanza 'required' igual aunque required=False.
            "paciente": {"required": False, "allow_null": True, "default": None},
        }


    def get_fields(self):
        # Belt-and-suspenders: parchamos el campo despues de que DRF lo construye
        # por si extra_kwargs no alcanza a aplicarse antes del binding.
        fields = super().get_fields()
        paciente_field = fields.get("paciente")
        if paciente_field is not None:
            paciente_field.required = False
            paciente_field.allow_null = True
        return fields


    def validate_fecha_cita(self, value):
        if value < date.today():
            raise serializers.ValidationError(
                "La fecha de la cita no puede ser en el pasado."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        instance = self.instance
        paciente = attrs.get("paciente", getattr(instance, "paciente", None))
        medico = attrs.get("medico", getattr(instance, "medico", None))
        fecha_cita = attrs.get("fecha_cita", getattr(instance, "fecha_cita", None))
        hora_cita = attrs.get("hora_cita", getattr(instance, "hora_cita", None))
        estado = attrs.get("estado", getattr(instance, "estado", None))
        tratamiento = attrs.get("tratamiento", getattr(instance, "tratamiento", None))

        if not (paciente and medico and fecha_cita and hora_cita):
            return attrs

        if _find_matching_horario(medico, fecha_cita, hora_cita) is None:
            raise serializers.ValidationError(
                {
                    "hora_cita": (
                        "La cita no esta dentro de un horario habilitado para ese medico "
                        "en la fecha/hora seleccionada."
                    )
                }
            )

        duplicate_for_patient = CitaMedica.objects.filter(
            paciente=paciente,
            fecha_cita=fecha_cita,
            hora_cita=hora_cita,
        )
        duplicate_for_doctor = CitaMedica.objects.filter(
            medico=medico,
            fecha_cita=fecha_cita,
            hora_cita=hora_cita,
        )
        if instance is not None:
            duplicate_for_patient = duplicate_for_patient.exclude(pk=instance.pk)
            duplicate_for_doctor = duplicate_for_doctor.exclude(pk=instance.pk)

        if duplicate_for_patient.exists():
            raise serializers.ValidationError(
                {"hora_cita": "El paciente ya tiene una cita programada en esa fecha y hora."}
            )
        if duplicate_for_doctor.exists():
            raise serializers.ValidationError(
                {"hora_cita": "El medico ya tiene una cita programada en esa fecha y hora."}
            )

        if estado == CitaMedica.EstadoChoices.ATENDIDA and not tratamiento:
            raise serializers.ValidationError(
                {"tratamiento": "Debe registrar tratamiento para marcar una cita como atendida."}
            )

        return attrs


class PatientRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        error_messages={"required": "El username es obligatorio.", "blank": "El username no puede ir vacio."},
    )
    password = serializers.CharField(
        write_only=True,
        error_messages={
            "required": "La contrasena es obligatoria.",
            "blank": "La contrasena no puede ir vacia.",
        },
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        error_messages={"required": "El email de usuario es obligatorio.", "invalid": "El email de usuario no es valido."}
    )
    nombre = serializers.CharField(
        max_length=120,
        error_messages={"required": "El nombre es obligatorio.", "blank": "El nombre no puede ir vacio."},
    )
    apellido = serializers.CharField(
        max_length=120,
        error_messages={"required": "El apellido es obligatorio.", "blank": "El apellido no puede ir vacio."},
    )
    dpi = serializers.CharField(
        max_length=13,
        error_messages={"required": "El DPI es obligatorio.", "blank": "El DPI no puede ir vacio."},
    )
    genero = serializers.ChoiceField(
        choices=Patient._meta.get_field("genero").choices,
        error_messages={"required": "El genero es obligatorio.", "invalid_choice": "El genero seleccionado no es valido."},
    )
    direccion = serializers.CharField(
        max_length=255,
        error_messages={"required": "La direccion es obligatoria.", "blank": "La direccion no puede ir vacia."},
    )
    telefono = serializers.CharField(
        max_length=15,
        error_messages={"required": "El telefono es obligatorio.", "blank": "El telefono no puede ir vacio."},
    )
    fecha_nacimiento = serializers.DateField(
        error_messages={"required": "La fecha de nacimiento es obligatoria.", "invalid": "Use formato YYYY-MM-DD para la fecha de nacimiento."}
    )
    correo_electronico = serializers.EmailField(
        error_messages={"required": "El correo electronico del perfil es obligatorio.", "invalid": "El correo electronico del perfil no es valido."}
    )
    fotografia = serializers.ImageField(required=False, allow_null=True)

    def validate_username(self, value):
        if not value:
            return value
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username ya existe.")
        return value

    def validate_email(self, value):
        if not value:
            return value
        return _validate_cross_email_uniqueness(value)

    def validate_password(self, value):
        return _validate_password_complexity(value)

    def validate_fecha_nacimiento(self, value):
        return _validate_minimum_age(value)

    def validate_telefono(self, value):
        return _normalize_phone(value)

    def validate_dpi(self, value):
        return _validate_dpi(value)

    def validate_correo_electronico(self, value):
        return _validate_cross_email_uniqueness(value)

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.pop("username", "").strip()
        raw_password = validated_data.pop("password")
        email = validated_data.pop("email", "").strip()
        profile_email = validated_data.get("correo_electronico")

        if not email:
            email = profile_email

        if not username:
            username = _generate_unique_username_from_email(email)

        # Temporal: auto-aprobar nuevos perfiles hasta implementar el flujo de aprobacion por admin.
        user = User(
            username=username,
            email=email,
            role=User.Role.PATIENT,
            approval_status=User.ApprovalStatus.APPROVED,
        )
        user.set_password(raw_password)
        user.save()

        patient = Patient.objects.create(user=user, **validated_data)
        return patient


class DoctorRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=150,
        error_messages={"required": "El username es obligatorio.", "blank": "El username no puede ir vacio."},
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "required": "La contrasena es obligatoria.",
            "blank": "La contrasena no puede ir vacia.",
            "min_length": "La contrasena debe tener al menos 8 caracteres.",
        },
    )
    email = serializers.EmailField(
        error_messages={"required": "El email de usuario es obligatorio.", "invalid": "El email de usuario no es valido."}
    )
    nombre = serializers.CharField(
        max_length=120,
        error_messages={"required": "El nombre es obligatorio.", "blank": "El nombre no puede ir vacio."},
    )
    apellido = serializers.CharField(
        max_length=120,
        error_messages={"required": "El apellido es obligatorio.", "blank": "El apellido no puede ir vacio."},
    )
    dpi = serializers.CharField(
        max_length=13,
        error_messages={"required": "El DPI es obligatorio.", "blank": "El DPI no puede ir vacio."},
    )
    fecha_nacimiento = serializers.DateField(
        error_messages={"required": "La fecha de nacimiento es obligatoria.", "invalid": "Use formato YYYY-MM-DD para la fecha de nacimiento."}
    )
    genero = serializers.ChoiceField(
        choices=Doctor._meta.get_field("genero").choices,
        error_messages={"required": "El genero es obligatorio.", "invalid_choice": "El genero seleccionado no es valido."},
    )
    direccion = serializers.CharField(
        max_length=255,
        error_messages={"required": "La direccion es obligatoria.", "blank": "La direccion no puede ir vacia."},
    )
    telefono = serializers.CharField(
        max_length=15,
        error_messages={"required": "El telefono es obligatorio.", "blank": "El telefono no puede ir vacio."},
    )
    numero_colegiado = serializers.CharField(
        max_length=50,
        error_messages={
            "required": "El numero colegiado es obligatorio.",
            "blank": "El numero colegiado no puede ir vacio.",
        },
    )
    especialidad = serializers.CharField(
        max_length=120,
        error_messages={"required": "La especialidad es obligatoria.", "blank": "La especialidad no puede ir vacia."},
    )
    direccion_clinica = serializers.CharField(
        max_length=255,
        error_messages={
            "required": "La direccion de clinica es obligatoria.",
            "blank": "La direccion de clinica no puede ir vacia.",
        },
    )
    correo_electronico = serializers.EmailField(
        error_messages={"required": "El correo electronico del perfil es obligatorio.", "invalid": "El correo electronico del perfil no es valido."}
    )
    fotografia = serializers.ImageField(required=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username ya existe.")
        return value

    def validate_email(self, value):
        return _validate_cross_email_uniqueness(value)

    def validate_password(self, value):
        return _validate_password_complexity(value)

    def validate_fecha_nacimiento(self, value):
        return _validate_minimum_age(value)

    def validate_telefono(self, value):
        return _normalize_phone(value)

    def validate_dpi(self, value):
        return _validate_dpi(value)

    def validate_correo_electronico(self, value):
        return _validate_cross_email_uniqueness(value)

    def validate_numero_colegiado(self, value):
        if Doctor.objects.filter(numero_colegiado=value).exists():
            raise serializers.ValidationError(
                "Este número de colegiado ya está registrado en el sistema."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.pop("username")
        raw_password = validated_data.pop("password")
        email = validated_data.pop("email")

        # Temporal: auto-aprobar nuevos perfiles hasta implementar el flujo de aprobacion por admin.
        user = User(
            username=username,
            email=email,
            role=User.Role.DOCTOR,
            approval_status=User.ApprovalStatus.APPROVED,
        )
        user.set_password(raw_password)
        user.save()

        doctor = Doctor.objects.create(user=user, **validated_data)
        return doctor
