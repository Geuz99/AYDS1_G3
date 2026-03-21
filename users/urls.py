from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
 
from .views import (
    CitaMedicaViewSet,
    DoctorRegistrationView,
    DoctorViewSet,
    HorarioViewSet,
    PatientRegistrationView,
    PatientViewSet,
)
# ← Importamos las nuevas vistas de auth
from .views_auth import AdminVerify2FAView, LoginView
 
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
 
    # Login unificado (reemplaza el TokenObtainPairView genérico)
    path("auth/login/", LoginView.as_view(), name="login"),
 
    # 2FA solo para admin
    path("auth/admin/verify-2fa/", AdminVerify2FAView.as_view(), name="admin-verify-2fa"),
 
    # Refresh token (sin cambios)
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]