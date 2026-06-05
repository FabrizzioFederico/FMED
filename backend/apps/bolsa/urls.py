from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InstitucionViewSet, OfertaViewSet, PostulacionViewSet

router = DefaultRouter()
router.register(r'instituciones', InstitucionViewSet)
router.register(r'ofertas', OfertaViewSet, basename='oferta')
router.register(r'postulaciones', PostulacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
