"""
Endpoints REST para calificaciones, actas y asistencias.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.usuarios.permissions import EsProfesor

from .models import Acta, Asistencia, Calificacion
from .serializers import ActaSerializer, AsistenciaSerializer, CalificacionSerializer
from .services import (
    ActaError, cargar_nota, cerrar_acta,
)


class ActaViewSet(viewsets.ModelViewSet):
    """CRUD de actas + acciones de carga de notas y cierre."""
    queryset = Acta.objects.select_related('profesor', 'comision', 'mesa') \
                          .prefetch_related('calificaciones__alumno')
    serializer_class = ActaSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [EsProfesor()]

    def perform_create(self, serializer):
        serializer.save(profesor=self.request.user)

    @action(detail=True, methods=['post'], url_path='cargar-nota')
    def cargar_nota_action(self, request, pk=None):
        """POST /api/actas/<id>/cargar-nota/
        body: {"alumno": <id>, "nota": <float>, "observaciones": "..."}"""
        acta = self.get_object()
        alumno_id = request.data.get('alumno')
        nota = request.data.get('nota')
        observaciones = request.data.get('observaciones', '')

        if alumno_id is None or nota is None:
            return Response(
                {'detail': 'Campos "alumno" y "nota" son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.usuarios.models import Usuario
        try:
            alumno = Usuario.objects.get(pk=alumno_id, rol=Usuario.Rol.ALUMNO)
        except Usuario.DoesNotExist:
            return Response({'detail': 'Alumno inexistente.'},
                            status=status.HTTP_404_NOT_FOUND)

        try:
            cal = cargar_nota(acta, alumno, nota, request.user, observaciones)
        except ActaError as e:
            return Response({'detail': str(e), 'tipo': e.__class__.__name__},
                            status=status.HTTP_400_BAD_REQUEST)

        return Response(CalificacionSerializer(cal).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """POST /api/actas/<id>/cerrar/ - cierra y firma el acta."""
        acta = self.get_object()
        try:
            cerrar_acta(acta, request.user)
        except ActaError as e:
            return Response({'detail': str(e), 'tipo': e.__class__.__name__},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response(ActaSerializer(acta).data, status=status.HTTP_200_OK)


class AsistenciaViewSet(viewsets.ModelViewSet):
    """RFC06 - registro de asistencias por clase."""
    queryset = Asistencia.objects.select_related('alumno', 'comision__materia', 'profesor')
    serializer_class = AsistenciaSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [EsProfesor()]

    def perform_create(self, serializer):
        serializer.save(profesor=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_calificaciones(request):
    """GET /api/mis-calificaciones/  - RFC02."""
    qs = Calificacion.objects.filter(alumno=request.user).select_related(
        'acta__comision__materia', 'acta__mesa__materia'
    )
    return Response(CalificacionSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_asistencias(request):
    """GET /api/mis-asistencias/  - RFC03."""
    qs = Asistencia.objects.filter(alumno=request.user).select_related(
        'comision__materia'
    )
    return Response(AsistenciaSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simular_condicion(request):
    """POST /api/simular-condicion/  — usa el patrón STRATEGY.

    body: {
      "promedio": 7.5,
      "asistencia": 80,
      "estrategia": "ESTANDAR" | "ESTRICTA" | "PROMOCION_DIRECTA"
    }

    Devuelve la condición final del alumno (PROMOCIONADO / REGULAR / LIBRE)
    calculada con la estrategia de evaluación elegida. Permite comparar
    cómo distintas estrategias evalúan el mismo desempeño.
    """
    from .patrones_strategy import (
        DesempenoAlumno, EvaluadorCondicion, obtener_estrategia, ESTRATEGIAS,
    )

    promedio = request.data.get('promedio')
    asistencia = request.data.get('asistencia')
    nombre_estrategia = request.data.get('estrategia', 'ESTANDAR')

    if promedio is None or asistencia is None:
        return Response(
            {'detail': 'Debés enviar "promedio" y "asistencia".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        desempeno = DesempenoAlumno(
            promedio_notas=promedio,
            porcentaje_asistencia=asistencia,
        )
    except Exception:
        return Response(
            {'detail': 'Los valores de promedio o asistencia no son válidos.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # El contexto usa la estrategia elegida sin conocer su detalle interno
    evaluador = EvaluadorCondicion(obtener_estrategia(nombre_estrategia))
    condicion = evaluador.evaluar(desempeno)

    return Response({
        'estrategia_usada': nombre_estrategia.upper(),
        'descripcion': evaluador.explicar(),
        'condicion': condicion,
        'estrategias_disponibles': list(ESTRATEGIAS.keys()),
    })
