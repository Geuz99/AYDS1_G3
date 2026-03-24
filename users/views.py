import datetime
from datetime import time

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CitaMedica, Doctor, Horario, Patient, User, WeekDayChoices
from .serializers import (
    CitaMedicaSerializer,
    DoctorRegistrationSerializer,
    DoctorSerializer,
    HorarioSerializer,
    PatientRegistrationSerializer,
    PatientSerializer,
)


def _format_serializer_errors(errors):
    formatted = {}

    for field, detail in errors.items():
        if isinstance(detail, list):
            formatted[field] = [str(item) for item in detail]
        elif isinstance(detail, dict):
            formatted[field] = _format_serializer_errors(detail)
        else:
            formatted[field] = [str(detail)]

    return formatted


WEEKDAY_INDEX_TO_CODE = {
    0: WeekDayChoices.MONDAY,
    1: WeekDayChoices.TUESDAY,
    2: WeekDayChoices.WEDNESDAY,
    3: WeekDayChoices.THURSDAY,
    4: WeekDayChoices.FRIDAY,
    5: WeekDayChoices.SATURDAY,
    6: WeekDayChoices.SUNDAY,
}


def _extract_horario_data(horario: Horario):
    return {
        "dias_semana": list(horario.dias_semana or []),
        "hora_inicio": horario.hora_inicio,
        "hora_fin": horario.hora_fin,
    }


def _is_cita_within_any_slot(cita: CitaMedica, horarios_data):
    day_code = WEEKDAY_INDEX_TO_CODE.get(cita.fecha_cita.weekday())
    if not day_code:
        return False

    for slot in horarios_data:
        dias = set((slot.get("dias_semana") or []))
        hora_inicio: time = slot.get("hora_inicio")
        hora_fin: time = slot.get("hora_fin")
        if day_code in dias and hora_inicio <= cita.hora_cita < hora_fin:
            return True

    return False


def _find_active_conflicts_for_doctor(doctor: Doctor, horarios_data):
    active_citas = CitaMedica.objects.filter(
        medico=doctor,
        estado=CitaMedica.EstadoChoices.ACTIVA,
    ).order_by("fecha_cita", "hora_cita")

    conflicts = []
    for cita in active_citas:
        if not _is_cita_within_any_slot(cita, horarios_data):
            conflicts.append(
                {
                    "id": cita.id,
                    "fecha_cita": str(cita.fecha_cita),
                    "hora_cita": str(cita.hora_cita),
                    "motivo_cita": cita.motivo_cita,
                }
            )

    return conflicts


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        if view.action == "create":
            return request.user.is_staff or getattr(request.user, "role", None) == User.Role.ADMIN

        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, "role", None) == User.Role.ADMIN:
            return True
        return getattr(obj, "user_id", None) == request.user.id


class IsDoctorOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_staff
            or getattr(request.user, "role", None) == User.Role.ADMIN
            or getattr(request.user, "role", None) == User.Role.DOCTOR
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, "role", None) == User.Role.ADMIN:
            return True
        return obj.doctor.user_id == request.user.id


class IsCitaParticipantOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        role = getattr(request.user, "role", None)
        if request.user.is_staff or role == User.Role.ADMIN:
            return True
        return role in (User.Role.PATIENT, User.Role.DOCTOR)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, "role", None) == User.Role.ADMIN:
            return True

        role = getattr(request.user, "role", None)
        if role == User.Role.PATIENT:
            return obj.paciente.user_id == request.user.id
        if role == User.Role.DOCTOR:
            return obj.medico.user_id == request.user.id
        return False


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.select_related("user").all()
    serializer_class = PatientSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        base_queryset = Patient.objects.select_related("user")
        user = self.request.user

        if not user.is_authenticated:
            return base_queryset.none()
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            return base_queryset
        if getattr(user, "role", None) == User.Role.PATIENT:
            return base_queryset.filter(user=user)
        return base_queryset.none()


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related("user").all()
    serializer_class = DoctorSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        base_queryset = Doctor.objects.select_related("user")
        user = self.request.user

        if not user.is_authenticated:
            return base_queryset.none()
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            return base_queryset
        if getattr(user, "role", None) == User.Role.DOCTOR:
            return base_queryset.filter(user=user)
        if getattr(user, "role", None) == User.Role.PATIENT:
            # Pacientes pueden ver todos los medicos aprobados para poder agendar citas
            return base_queryset.filter(user__approval_status=User.ApprovalStatus.APPROVED)
        return base_queryset.none()

    @action(
        detail=True,
        methods=["get"],
        url_path="disponibilidad",
        permission_classes=[permissions.IsAuthenticated],
    )
    def disponibilidad(self, request, pk=None):
        """GET /api/doctors/{id}/disponibilidad/?fecha=YYYY-MM-DD

        Retorna la lista de horas disponibles del medico para la fecha dada,
        en bloques de 30 minutos, excluyendo las ya ocupadas por citas ACTIVAS.
        """
        fecha_str = request.query_params.get("fecha")
        if not fecha_str:
            return Response(
                {"detail": "El parametro 'fecha' es requerido (formato YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fecha = datetime.date.fromisoformat(fecha_str)
        except ValueError:
            return Response(
                {"detail": "Formato de fecha invalido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if fecha < datetime.date.today():
            return Response(
                {"detail": "No se puede consultar disponibilidad para fechas pasadas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doctor = self.get_object()
        day_code = WEEKDAY_INDEX_TO_CODE.get(fecha.weekday())

        # Obtener horarios del medico que incluyan ese dia de semana
        horarios_del_dia = [
            h for h in Horario.objects.filter(doctor=doctor)
            if day_code in (h.dias_semana or [])
        ]

        if not horarios_del_dia:
            return Response(
                {
                    "fecha": fecha_str,
                    "doctor_id": doctor.pk,
                    "disponibles": [],
                    "mensaje": "El medico no tiene horario habilitado para ese dia.",
                },
                status=status.HTTP_200_OK,
            )

        # Citas ya reservadas en esa fecha (estado ACTIVA)
        citas_ocupadas = set(
            CitaMedica.objects.filter(
                medico=doctor,
                fecha_cita=fecha,
                estado=CitaMedica.EstadoChoices.ACTIVA,
            ).values_list("hora_cita", flat=True)
        )

        SLOT_MINUTES = 30

        horas_disponibles = []
        for horario in horarios_del_dia:
            # Iterar sobre bloques de SLOT_MINUTES dentro del horario
            cursor = datetime.datetime.combine(fecha, horario.hora_inicio)
            fin = datetime.datetime.combine(fecha, horario.hora_fin)
            delta = datetime.timedelta(minutes=SLOT_MINUTES)

            while cursor + delta <= fin:
                slot_time = cursor.time()
                if slot_time not in citas_ocupadas:
                    horas_disponibles.append(slot_time.strftime("%H:%M"))
                cursor += delta

        # Eliminar duplicados (si hubiera horarios solapados) y ordenar
        horas_disponibles = sorted(set(horas_disponibles))

        return Response(
            {
                "fecha": fecha_str,
                "doctor_id": doctor.pk,
                "disponibles": horas_disponibles,
            },
            status=status.HTTP_200_OK,
        )


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.select_related("doctor", "doctor__user").all()
    serializer_class = HorarioSerializer
    permission_classes = [IsDoctorOwnerOrAdmin]

    def get_queryset(self):
        base_queryset = Horario.objects.select_related("doctor", "doctor__user")
        user = self.request.user

        if not user.is_authenticated:
            return base_queryset.none()
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            return base_queryset
        if getattr(user, "role", None) == User.Role.DOCTOR:
            return base_queryset.filter(doctor__user=user)
        return base_queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            if serializer.validated_data.get("doctor") is None:
                raise ValidationError({"doctor": ["Debe indicar el medico para crear el horario."]})
            serializer.save()
            return

        doctor = Doctor.objects.filter(user=user).first()
        if doctor is None:
            raise PermissionDenied("No existe perfil medico asociado al usuario autenticado.")

        incoming_slot = {
            "dias_semana": list(serializer.validated_data.get("dias_semana") or []),
            "hora_inicio": serializer.validated_data.get("hora_inicio"),
            "hora_fin": serializer.validated_data.get("hora_fin"),
        }
        current_slots = [_extract_horario_data(slot) for slot in Horario.objects.filter(doctor=doctor)]
        proposed_slots = current_slots + [incoming_slot]

        conflicts = _find_active_conflicts_for_doctor(doctor, proposed_slots)
        if conflicts:
            raise ValidationError(
                {
                    "detail": "No se puede guardar el horario porque existen citas activas fuera del nuevo rango.",
                    "affected_appointments": conflicts,
                }
            )

        serializer.save(doctor=doctor)

    def perform_update(self, serializer):
        user = self.request.user
        instance: Horario = serializer.instance

        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            serializer.save()
            return

        doctor = instance.doctor
        incoming_slot = {
            "dias_semana": list(serializer.validated_data.get("dias_semana", instance.dias_semana) or []),
            "hora_inicio": serializer.validated_data.get("hora_inicio", instance.hora_inicio),
            "hora_fin": serializer.validated_data.get("hora_fin", instance.hora_fin),
        }
        current_slots = [
            _extract_horario_data(slot)
            for slot in Horario.objects.filter(doctor=doctor).exclude(pk=instance.pk)
        ]
        proposed_slots = current_slots + [incoming_slot]

        conflicts = _find_active_conflicts_for_doctor(doctor, proposed_slots)
        if conflicts:
            raise ValidationError(
                {
                    "detail": "No se puede actualizar el horario porque existen citas activas fuera del nuevo rango.",
                    "affected_appointments": conflicts,
                }
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            instance.delete()
            return

        doctor = instance.doctor
        proposed_slots = [
            _extract_horario_data(slot)
            for slot in Horario.objects.filter(doctor=doctor).exclude(pk=instance.pk)
        ]
        conflicts = _find_active_conflicts_for_doctor(doctor, proposed_slots)
        if conflicts:
            raise ValidationError(
                {
                    "detail": "No se puede eliminar el horario porque dejaria citas activas fuera de disponibilidad.",
                    "affected_appointments": conflicts,
                }
            )

        instance.delete()


class CitaMedicaViewSet(viewsets.ModelViewSet):
    queryset = CitaMedica.objects.select_related(
        "paciente",
        "paciente__user",
        "medico",
        "medico__user",
    ).all()
    serializer_class = CitaMedicaSerializer
    permission_classes = [IsCitaParticipantOrAdmin]

    def get_queryset(self):
        base_queryset = CitaMedica.objects.select_related(
            "paciente",
            "paciente__user",
            "medico",
            "medico__user",
        )
        user = self.request.user

        if not user.is_authenticated:
            return base_queryset.none()
        if user.is_staff or getattr(user, "role", None) == User.Role.ADMIN:
            return base_queryset
        if getattr(user, "role", None) == User.Role.PATIENT:
            return base_queryset.filter(paciente__user=user)
        if getattr(user, "role", None) == User.Role.DOCTOR:
            return base_queryset.filter(medico__user=user)
        return base_queryset.none()

    def perform_create(self, serializer):
        """Asigna automaticamente el paciente autenticado al crear una cita.
        Solo usuarios con rol PATIENT pueden programar citas por este endpoint.
        Los administradores pueden enviar el paciente explicitamente en el payload.
        """
        user = self.request.user
        role = getattr(user, "role", None)

        # Administradores pueden especificar el paciente manualmente en el payload
        if user.is_staff or role == User.Role.ADMIN:
            serializer.save()
            return

        # Solo pacientes aprobados pueden crear citas
        if role != User.Role.PATIENT:
            raise PermissionDenied(
                "Solo un paciente autenticado puede programar una cita."
            )

        patient = Patient.objects.filter(user=user).first()
        if patient is None:
            raise PermissionDenied(
                "No existe un perfil de paciente asociado al usuario autenticado."
            )

        serializer.save(paciente=patient)

    def perform_update(self, serializer):
        user = self.request.user
        role = getattr(user, "role", None)

        if role == User.Role.PATIENT:
            validated = serializer.validated_data
            campos_enviados = set(validated.keys())

            # El paciente solo puede tocar el campo "estado"
            campos_no_permitidos = campos_enviados - {"estado"}
            if campos_no_permitidos:
                raise ValidationError(
                    "Un paciente solo puede modificar el campo 'estado' de una cita."
                )

            nuevo_estado = validated.get("estado")
            if nuevo_estado is not None and nuevo_estado != CitaMedica.EstadoChoices.CANCELADA_PACIENTE:
                raise ValidationError(
                    "Un paciente solo puede cancelar su propia cita (estado: CANCELADA_PACIENTE)."
                )

        cita_original = serializer.instance
        estado_anterior = cita_original.estado

        cita_actualizada = serializer.save()

        if (
            estado_anterior != CitaMedica.EstadoChoices.CANCELADA_MEDICO
            and cita_actualizada.estado == CitaMedica.EstadoChoices.CANCELADA_MEDICO
        ):
            self._send_cancelation_email_to_patient(cita_actualizada)

    def _send_cancelation_email_to_patient(self, cita: CitaMedica) -> None:
        recipient = cita.paciente.correo_electronico or cita.paciente.user.email
        if not recipient:
            return

        subject = "SaludPlus: Cita cancelada por el medico"
        body = (
            "Estimado paciente,\n\n"
            "Lamentamos informarle que su cita fue cancelada por el medico.\n\n"
            f"Fecha: {cita.fecha_cita}\n"
            f"Hora: {cita.hora_cita}\n"
            f"Motivo de cita: {cita.motivo_cita}\n\n"
            "Le ofrecemos una disculpa por los inconvenientes ocasionados.\n"
            "Por favor, reprograme su cita cuando le sea posible.\n\n"
            "Atentamente,\n"
            "Equipo SaludPlus"
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@saludplus.local"),
            recipient_list=[recipient],
            fail_silently=True,
        )


class PatientRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PatientRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "message": "Errores de validacion en el registro de paciente.",
                    "errors": _format_serializer_errors(serializer.errors),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        patient = serializer.save()
        return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)


class DoctorRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DoctorRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "message": "Errores de validacion en el registro de medico.",
                    "errors": _format_serializer_errors(serializer.errors),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        doctor = serializer.save()
        return Response(DoctorSerializer(doctor).data, status=status.HTTP_201_CREATED)
