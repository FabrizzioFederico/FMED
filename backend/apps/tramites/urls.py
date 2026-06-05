from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TramiteViewSet, DocumentoViewSet, tramites_pendientes

router = DefaultRouter()
router.register(r'tramites', TramiteViewSet, basename='tramite')
router.register(r'documentos', DocumentoViewSet, basename='documento')

urlpatterns = [
    path('tramites/pendientes/', tramites_pendientes, name='tramites_pendientes'),
    path('', include(router.urls)),
]
