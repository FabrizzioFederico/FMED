from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, me, actualizar_perfil


# Estas URLs se montan bajo /api/auth/
urlpatterns = [
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', me, name='auth_me'),
    path('perfil/', actualizar_perfil, name='actualizar_perfil'),
]
