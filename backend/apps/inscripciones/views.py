"""
Endpoints REST para inscripciones.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.academico.models import Comision, MesaExamen
from apps.usuarios.permissions import EsAlumno

from .models import InscripcionCursada, InscripcionFinal
from .serializers import InscripcionCursadaSerializer, InscripcionFinalSerializer
from .services import (
    InscripcionError,
    inscribir_alumno_a_final,
    inscribir_alumno_a_cursada,
)


@api_view(['POST'])
@permission_classes([EsAlumno])
def inscribir_final(request):
    """POST /api/inscripciones/final/  body: {"mesa": <id>}
    Implementa el caso de uso 9.1."""
    mesa_id = request.data.get('mesa')
    if not mesa_id:
        return Response({'detail': 'Campo "mesa" requerido.'},
                        status=status.HTTP_400_BAD_REQUEST)

    mesa = get_object_or_404(MesaExamen, pk=mesa_id)
    try:
        inscripcion = inscribir_alumno_a_final(request.user, mesa)
    except InscripcionError as e:
        return Response({'detail': str(e), 'tipo': e.__class__.__name__},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response(InscripcionFinalSerializer(inscripcion).data,
                    status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([EsAlumno])
def inscribir_cursada(request):
    """POST /api/inscripciones/cursada/  body: {"comision": <id>}"""
    comision_id = request.data.get('comision')
    if not comision_id:
        return Response({'detail': 'Campo "comision" requerido.'},
                        status=status.HTTP_400_BAD_REQUEST)

    comision = get_object_or_404(Comision, pk=comision_id)
    try:
        inscripcion = inscribir_alumno_a_cursada(request.user, comision)
    except InscripcionError as e:
        return Response({'detail': str(e), 'tipo': e.__class__.__name__},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response(InscripcionCursadaSerializer(inscripcion).data,
                    status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_inscripciones(request):
    """GET /api/inscripciones/mis/ → todas las inscripciones del alumno autenticado."""
    cursadas = InscripcionCursada.objects.filter(alumno=request.user).select_related(
        'comision__materia'
    )
    finales = InscripcionFinal.objects.filter(alumno=request.user).select_related(
        'mesa__materia'
    )
    return Response({
        'cursadas': InscripcionCursadaSerializer(cursadas, many=True).data,
        'finales': InscripcionFinalSerializer(finales, many=True).data,
    })


class InscripcionCursadaAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Solo lectura para admin/listado general."""
    queryset = InscripcionCursada.objects.select_related('alumno', 'comision__materia')
    serializer_class = InscripcionCursadaSerializer
    permission_classes = [IsAuthenticated]


class InscripcionFinalAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InscripcionFinal.objects.select_related('alumno', 'mesa__materia')
    serializer_class = InscripcionFinalSerializer
    permission_classes = [IsAuthenticated]
