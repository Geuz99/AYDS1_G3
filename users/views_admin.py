from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User


class UserApprovalSerializer(serializers.Serializer):
    approval_status = serializers.ChoiceField(
        choices=User.ApprovalStatus.choices
    )


class UserApprovalView(APIView):
    """
    PATCH /api/users/{user_id}/
    Solo el administrador puede cambiar el approval_status de un usuario.
    Body: { "approval_status": "APPROVED" | "REJECTED" | "INACTIVE" }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        # Solo admin puede usar este endpoint
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "No tienes permiso para realizar esta acción."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Usuario no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # No permitir que el admin se modifique a sí mismo
        if user.pk == request.user.pk:
            return Response(
                {"detail": "No puedes modificar tu propio estado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = UserApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user.approval_status = serializer.validated_data["approval_status"]
        user.save(update_fields=["approval_status"])

        return Response(
            {
                "detail": f"Estado actualizado a {user.approval_status}.",
                "user_id": user.pk,
                "approval_status": user.approval_status,
            },
            status=status.HTTP_200_OK,
        )