from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import listar_alumnos, UsuarioViewSet


router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

# Estas URLs se montan bajo /api/
urlpatterns = [
    # IMPORTANTE: esta ruta va ANTES del router para que /usuarios/alumnos/
    # no se confunda con /usuarios/<pk>/
    path('usuarios/alumnos/', listar_alumnos, name='listar_alumnos'),
    path('', include(router.urls)),
]
