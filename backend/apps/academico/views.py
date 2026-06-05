"""
Vistas para entidades académicas.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.usuarios.permissions import EsAdministrativo

from .models import (
    PlanEstudio, Materia, PeriodoLectivo,
    Aula, Comision, MesaExamen,
)
from .serializers import (
    PlanEstudioSerializer, MateriaSerializer, PeriodoLectivoSerializer,
    AulaSerializer, ComisionSerializer, MesaExamenSerializer,
)


class SoloAdminEscribeMixin:
    """Lectura para autenticados, escritura para administrativos."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [EsAdministrativo()]


class PlanEstudioViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    queryset = PlanEstudio.objects.all()
    serializer_class = PlanEstudioSerializer


class MateriaViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    queryset = Materia.objects.select_related('plan').prefetch_related('correlativas__requiere')
    serializer_class = MateriaSerializer


class PeriodoLectivoViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    """RFC9 - el administrador configura períodos y calendarios."""
    queryset = PeriodoLectivo.objects.all()
    serializer_class = PeriodoLectivoSerializer


class AulaViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    queryset = Aula.objects.all()
    serializer_class = AulaSerializer


class ComisionViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    """RFC7 - el administrador crea comisiones."""
    queryset = Comision.objects.select_related('materia', 'periodo', 'aula').prefetch_related('profesores')
    serializer_class = ComisionSerializer


class MesaExamenViewSet(SoloAdminEscribeMixin, viewsets.ModelViewSet):
    queryset = MesaExamen.objects.select_related('materia').prefetch_related('profesores')
    serializer_class = MesaExamenSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estructura_plan(request, plan_id):
    """GET /api/planes/<id>/estructura/  — usa el patrón COMPOSITE.

    Construye el árbol del plan de estudios (Plan → Años → Materias) y
    devuelve la estructura junto con totales calculados recursivamente
    (carga horaria total, cantidad de materias).

    Gracias al Composite, pedir la carga horaria del plan completo o de
    un solo año usa exactamente el mismo método.
    """
    from .patrones_composite import construir_arbol_plan

    plan = get_object_or_404(PlanEstudio, pk=plan_id)
    arbol = construir_arbol_plan(plan)

    # Armamos la respuesta recorriendo el árbol Composite
    anios = []
    for nodo_anio in arbol.hijos():
        materias = [
            {
                'codigo': m.codigo,
                'nombre': m.nombre,
                'carga_horaria': m.carga_horaria,
            }
            for m in nodo_anio.hijos()
        ]
        anios.append({
            'nombre': nodo_anio.nombre,
            'cantidad_materias': nodo_anio.cantidad_materias(),
            'carga_horaria': nodo_anio.carga_horaria_total(),
            'materias': materias,
        })

    return Response({
        'plan': plan.nombre,
        'carga_horaria_total': arbol.carga_horaria_total(),
        'cantidad_materias_total': arbol.cantidad_materias(),
        'anios': anios,
        # Representación en texto del árbol (útil para verlo de un vistazo)
        'arbol_texto': arbol.mostrar(),
    })
