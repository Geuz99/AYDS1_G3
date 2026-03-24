from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from users.views_reportes import ReportesView

from .views import (
    CitaMedicaViewSet,
    DoctorRegistrationView,
    DoctorViewSet,
    HorarioViewSet,
    PacienteDashboardMedicosView,
    PatientRegistrationView,
    PatientViewSet,
)
from .views_auth import AdminVerify2FAView, ChangePasswordView, LoginView
from .views_admin import UserApprovalView

router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patients")
router.register(r"doctors", DoctorViewSet, basename="doctors")
router.register(r"horarios", HorarioViewSet, basename="horarios")
router.register(r"citas", CitaMedicaViewSet, basename="citas")

urlpatterns = [
    path("", include(router.urls)),

    # Registro
    path("auth/register/patient/", PatientRegistrationView.as_view(), name="register-patient"),
    path("auth/register/doctor/", DoctorRegistrationView.as_view(), name="register-doctor"),

    # Login unificado
    path("auth/login/", LoginView.as_view(), name="login"),

    # Cambio de contraseña para usuario autenticado
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),

    # Compatibilidad retroactiva
    path("auth/token/", LoginView.as_view(), name="token-obtain-compat"),

    # 2FA solo para admin
    path("auth/admin/verify-2fa/", AdminVerify2FAView.as_view(), name="admin-verify-2fa"),

    # Gestión de usuarios por admin (aprobar, rechazar, dar de baja)
    path("users/<int:user_id>/", UserApprovalView.as_view(), name="user-approval"),

    # Dashboard paciente: medicos disponibles para agendar
    path(
        "pacientes/dashboard/medicos/",
        PacienteDashboardMedicosView.as_view(),
        name="paciente-dashboard-medicos",
    ),

    # Refresh token
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("admin/reportes/", ReportesView.as_view(), name="1admin-reportes"),
]