from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CitaMedica, Doctor, Horario, Patient, User
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
        return base_queryset.none()


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
            serializer.save()
            return

        doctor = Doctor.objects.filter(user=user).first()
        if doctor is None:
            raise PermissionDenied("No existe perfil medico asociado al usuario autenticado.")
        serializer.save(doctor=doctor)


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
