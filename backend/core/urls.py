"""
URLs raíz del proyecto.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.usuarios.urls')),
    path('api/', include('apps.usuarios.urls_api')),
    path('api/', include('apps.academico.urls')),
    path('api/', include('apps.inscripciones.urls')),
    path('api/', include('apps.calificaciones.urls')),
    path('api/', include('apps.tramites.urls')),
    path('api/', include('apps.bolsa.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
