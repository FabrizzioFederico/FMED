"""
Endpoints REST para trámites y documentos. Implementa RFC04, RFC10
y el caso de uso 9.3 (verificación y aprobación del alumno).
"""
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.usuarios.permissions import EsAdministrativo, EsAlumno

from .models import Documento, EstadoTramite, Tramite
from .serializers import DocumentoSerializer, TramiteSerializer
from .services import (
    TramiteError, aprobar_documento, rechazar_documento, resolver_tramite,
)


class TramiteViewSet(viewsets.ModelViewSet):
    """RFC04: el alumno crea trámites. RFC10: el admin los resuelve."""
    queryset = Tramite.objects.select_related('alumno', 'administrativo')
    serializer_class = TramiteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        # Los alumnos solo ven los propios
        if u.es_alumno:
            return qs.filter(alumno=u)
        return qs

    def get_permissions(self):
        if self.action in ('create',):
            return [EsAlumno()]
        if self.action in ('resolver',):
            return [EsAdministrativo()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(alumno=self.request.user)

    @action(detail=True, methods=['post'])
    def resolver(self, request, pk=None):
        """POST /api/tramites/<id>/resolver/
        body: {"aprobado": true | false, "motivo": "..."}"""
        tramite = self.get_object()
        aprobado = bool(request.data.get('aprobado', False))
        motivo = request.data.get('motivo', '')
        try:
            resolver_tramite(tramite, request.user, aprobado, motivo)
        except TramiteError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TramiteSerializer(tramite).data)

    @action(detail=True, methods=['get'])
    def certificado(self, request, pk=None):
        """GET /api/tramites/<id>/certificado/
        Descarga el certificado del trámite en PDF.

        Solo se puede descargar si:
          - El trámite pertenece al alumno que lo solicita (o es admin).
          - El trámite está APROBADO.
        """
        from django.http import HttpResponse
        from .certificados import generar_certificado_pdf

        tramite = self.get_object()

        # Un alumno solo puede descargar su propio certificado
        if request.user.es_alumno and tramite.alumno_id != request.user.id:
            return Response(
                {'detail': 'No podés descargar un certificado de otro alumno.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Solo trámites aprobados generan certificado
        if tramite.estado != EstadoTramite.APROBADO:
            return Response(
                {'detail': 'El certificado solo está disponible si el trámite '
                           'fue aprobado por el área administrativa.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pdf_bytes = generar_certificado_pdf(tramite)

        respuesta = HttpResponse(pdf_bytes, content_type='application/pdf')
        nombre_archivo = f'certificado_tramite_{tramite.id}.pdf'
        respuesta['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
        return respuesta


class DocumentoViewSet(viewsets.ModelViewSet):
    """El alumno sube documentos. El administrativo los valida (caso 9.3)."""
    queryset = Documento.objects.select_related('alumno', 'revisado_por')
    serializer_class = DocumentoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        if u.es_alumno:
            return qs.filter(alumno=u)
        return qs

    def get_permissions(self):
        if self.action in ('create',):
            return [EsAlumno()]
        if self.action in ('validar', 'pendientes'):
            return [EsAdministrativo()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(alumno=self.request.user, estado=EstadoTramite.PENDIENTE)

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """GET /api/documentos/pendientes/ - lista de docs por revisar (caso 9.3 paso 2)."""
        qs = self.get_queryset().filter(estado=EstadoTramite.PENDIENTE)
        serializer = DocumentoSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def validar(self, request, pk=None):
        """POST /api/documentos/<id>/validar/
        body: {"aprobar": true | false, "motivo": "..."}
        Implementa el caso de uso 9.3 (paso 5 normal y 4.1-4.3 alternativo)."""
        documento = self.get_object()
        aprobar = bool(request.data.get('aprobar', False))
        motivo = request.data.get('motivo', '')

        try:
            if aprobar:
                aprobar_documento(documento, request.user)
            else:
                rechazar_documento(documento, request.user, motivo)
        except TramiteError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            DocumentoSerializer(documento, context={'request': request}).data
        )


@api_view(['GET'])
@permission_classes([EsAdministrativo])
def tramites_pendientes(request):
    """GET /api/tramites/pendientes/ - trámites pendientes para el administrativo."""
    qs = Tramite.objects.filter(estado=EstadoTramite.PENDIENTE).select_related('alumno')
    return Response(TramiteSerializer(qs, many=True).data)
