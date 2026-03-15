from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    CitaMedicaViewSet,
    DoctorRegistrationView,
    DoctorViewSet,
    HorarioViewSet,
    PatientRegistrationView,
    PatientViewSet,
)

router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patients")
router.register(r"doctors", DoctorViewSet, basename="doctors")
router.register(r"horarios", HorarioViewSet, basename="horarios")
router.register(r"citas", CitaMedicaViewSet, basename="citas")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/patient/", PatientRegistrationView.as_view(), name="register-patient"),
    path("auth/register/doctor/", DoctorRegistrationView.as_view(), name="register-doctor"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
