from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Count

from .models import User, CitaMedica, Doctor


class ReportesView(APIView):
    """
    GET /api/admin/reportes/
    Solo accesible para administradores.
    Retorna dos reportes:
    1. Médicos con más pacientes atendidos
    2. Especialidades con más citas generadas
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {"detail": "No tienes permiso para ver los reportes."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Reporte 1: médicos con más citas ATENDIDAS
        medicos_top = (
            CitaMedica.objects
            .filter(estado=CitaMedica.EstadoChoices.ATENDIDA)
            .values("medico__nombre", "medico__apellido", "medico__especialidad")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        reporte_medicos = [
            {
                "medico": f"Dr. {m['medico__nombre']} {m['medico__apellido']}",
                "especialidad": m["medico__especialidad"],
                "total_atendidos": m["total"],
            }
            for m in medicos_top
        ]

        # Reporte 2: especialidades con más citas (cualquier estado)
        especialidades_top = (
            CitaMedica.objects
            .values("medico__especialidad")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        reporte_especialidades = [
            {
                "especialidad": e["medico__especialidad"],
                "total_citas": e["total"],
            }
            for e in especialidades_top
        ]

        return Response(
            {
                "medicos_mas_atendidos": reporte_medicos,
                "especialidades_mas_demandadas": reporte_especialidades,
            },
            status=status.HTTP_200_OK,
        )
