from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    inscribir_final, inscribir_cursada, mis_inscripciones,
    InscripcionCursadaAdminViewSet, InscripcionFinalAdminViewSet,
)

router = DefaultRouter()
router.register(r'inscripciones-cursadas', InscripcionCursadaAdminViewSet,
                basename='inscripcion-cursada-admin')
router.register(r'inscripciones-finales', InscripcionFinalAdminViewSet,
                basename='inscripcion-final-admin')

urlpatterns = [
    path('inscripciones/final/', inscribir_final, name='inscribir_final'),
    path('inscripciones/cursada/', inscribir_cursada, name='inscribir_cursada'),
    path('inscripciones/mis/', mis_inscripciones, name='mis_inscripciones'),
    path('', include(router.urls)),
]
