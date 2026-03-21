from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers_auth import CustomTokenObtainPairSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }

    Respuesta exitosa para PATIENT / DOCTOR:
    {
        "access": "...",
        "refresh": "...",
        "role": "PATIENT" | "DOCTOR",
        "user_id": 1,
        "email": "..."
    }

    Respuesta exitosa para ADMIN (requiere 2FA):
    {
        "access": "...",
        "refresh": "...",
        "role": "ADMIN",
        "requires_2fa": true,
        "user_id": 1,
        "email": "..."
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class AdminVerify2FAView(APIView):
    """
    POST /api/auth/admin/verify-2fa/
    Header: Authorization: Bearer <access_token>
    Body (multipart/form-data): { "archivo": <archivo auth2-ayd1.txt> }

    Valida la segunda contraseña del administrador.
    El archivo debe llamarse exactamente 'auth2-ayd1.txt' y
    su contenido es la segunda contraseña en texto plano
    (que fue almacenada encriptada en la BD con set_second_password).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Solo el rol ADMIN puede usar este endpoint
        if user.role != User.Role.ADMIN:
            return Response(
                {"detail": "No tienes permiso para realizar esta acción."},
                status=status.HTTP_403_FORBIDDEN,
            )

        contenido = None

        # Opción 1: archivo subido (multipart/form-data)
        archivo = request.FILES.get("archivo")
        if archivo:
            if archivo.name != "auth2-ayd1.txt":
                return Response(
                    {"detail": "El archivo debe llamarse exactamente 'auth2-ayd1.txt'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                contenido = archivo.read().decode("utf-8").strip()
            except Exception:
                return Response(
                    {"detail": "No se pudo leer el archivo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Opción 2: contenido enviado como JSON { "password": "..." }
        else:
            contenido = request.data.get("password", "").strip()

        if not contenido:
            return Response(
                {"detail": "Debes enviar el archivo auth2-ayd1.txt o el campo 'password'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar la segunda contraseña contra el hash en la BD
        if not user.check_second_password(contenido):
            return Response(
                {"detail": "La contraseña de autenticación no es válida."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 2FA exitoso
        return Response(
            {
                "detail": "Autenticación de dos factores exitosa.",
                "verified": True,
                "role": user.role,
                "user_id": user.id,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )