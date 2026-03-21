from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class CustomTokenObtainPairSerializer(serializers.Serializer):
    """
    Serializer de login completamente personalizado.
    Autentica por email, valida approval_status e incluye role en la respuesta.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        # Buscar usuario por email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Credenciales incorrectas. Verifica tu correo y contraseña."}
            )

        # Verificar contraseña
        if not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Credenciales incorrectas. Verifica tu correo y contraseña."}
            )

        # Verificar que is_active sea True
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Tu cuenta está desactivada."}
            )

        # Validar approval_status para PATIENT y DOCTOR
        if user.role in (User.Role.PATIENT, User.Role.DOCTOR):
            if user.approval_status == User.ApprovalStatus.PENDING:
                raise serializers.ValidationError(
                    {"detail": "Tu cuenta está pendiente de aprobación por el administrador."}
                )
            if user.approval_status == User.ApprovalStatus.REJECTED:
                raise serializers.ValidationError(
                    {"detail": "Tu solicitud fue rechazada. Contacta al administrador."}
                )
            if user.approval_status == User.ApprovalStatus.INACTIVE:
                raise serializers.ValidationError(
                    {"detail": "Tu cuenta ha sido dada de baja. Contacta al administrador."}
                )

        # Generar tokens JWT manualmente
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["email"] = user.email

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": user.role,
            "user_id": user.id,
            "email": user.email,
        }

        if user.role == User.Role.ADMIN:
            data["requires_2fa"] = True

        return data