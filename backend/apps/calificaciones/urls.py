from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ActaViewSet, AsistenciaViewSet,
    mis_calificaciones, mis_asistencias, simular_condicion,
)

router = DefaultRouter()
router.register(r'actas', ActaViewSet, basename='acta')
router.register(r'asistencias', AsistenciaViewSet, basename='asistencia')

urlpatterns = [
    path('mis-calificaciones/', mis_calificaciones, name='mis_calificaciones'),
    path('mis-asistencias/', mis_asistencias, name='mis_asistencias'),
    path('simular-condicion/', simular_condicion, name='simular_condicion'),
    path('', include(router.urls)),
]
