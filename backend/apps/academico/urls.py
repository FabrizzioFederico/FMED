from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PlanEstudioViewSet, MateriaViewSet, PeriodoLectivoViewSet,
    AulaViewSet, ComisionViewSet, MesaExamenViewSet,
    estructura_plan,
)

router = DefaultRouter()
router.register(r'planes', PlanEstudioViewSet)
router.register(r'materias', MateriaViewSet)
router.register(r'periodos', PeriodoLectivoViewSet)
router.register(r'aulas', AulaViewSet)
router.register(r'comisiones', ComisionViewSet)
router.register(r'mesas-examen', MesaExamenViewSet)

urlpatterns = [
    # Endpoint que usa el patrón Composite (va antes del router)
    path('planes/<int:plan_id>/estructura/', estructura_plan, name='estructura_plan'),
    path('', include(router.urls)),
]
