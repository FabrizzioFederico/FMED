"""
Endpoints REST de bolsa de trabajo.
"""
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.usuarios.permissions import EsAdministrativo, EsAlumno

from .models import Institucion, Oferta, Postulacion
from .serializers import (
    InstitucionSerializer, OfertaSerializer, PostulacionSerializer,
)


class InstitucionViewSet(viewsets.ModelViewSet):
    queryset = Institucion.objects.all()
    serializer_class = InstitucionSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [EsAdministrativo()]


class OfertaViewSet(viewsets.ModelViewSet):
    serializer_class = OfertaSerializer

    def get_queryset(self):
        # Cada vez que se consultan las ofertas, primero cerramos las
        # que hayan vencido. Así el cierre por fecha es automático.
        Oferta.cerrar_vencidas()
        return Oferta.objects.select_related('institucion')

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [EsAdministrativo()]


class PostulacionViewSet(viewsets.ModelViewSet):
    queryset = Postulacion.objects.select_related('alumno', 'oferta__institucion')
    serializer_class = PostulacionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user
        if u.es_alumno:
            return qs.filter(alumno=u)
        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [EsAlumno()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [EsAdministrativo()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        oferta = serializer.validated_data.get('oferta')
        # Cerramos la oferta si venció, antes de validar
        if oferta:
            oferta.cerrar_si_vencio()
            if oferta.estado == Oferta.Estado.CERRADA:
                raise ValidationError(
                    'Esta oferta está cerrada: ya no admite postulaciones.'
                )
        serializer.save(alumno=self.request.user)
