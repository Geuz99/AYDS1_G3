from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


PASSWORD_LOWER_REGEX = __import__("re").compile(r"[a-z]")
PASSWORD_UPPER_REGEX = __import__("re").compile(r"[A-Z]")
PASSWORD_DIGIT_REGEX = __import__("re").compile(r"[0-9]")


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


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("La contrasena debe tener al menos 8 caracteres.")
        if not PASSWORD_LOWER_REGEX.search(value):
            raise serializers.ValidationError("La contrasena debe incluir al menos 1 letra minuscula.")
        if not PASSWORD_UPPER_REGEX.search(value):
            raise serializers.ValidationError("La contrasena debe incluir al menos 1 letra mayuscula.")
        if not PASSWORD_DIGIT_REGEX.search(value):
            raise serializers.ValidationError("La contrasena debe incluir al menos 1 numero.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")

        if not user.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": "La contrasena actual no es correcta."}
            )

        if current_password == new_password:
            raise serializers.ValidationError(
                {"new_password": "La nueva contrasena debe ser diferente a la actual."}
            )

        return attrs