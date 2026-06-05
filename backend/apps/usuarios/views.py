"""
Vistas de autenticación y gestión de usuarios.
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .permissions import EsAdministrativo
from .serializers import (
    CustomTokenObtainPairSerializer,
    UsuarioSerializer,
    UsuarioCrearSerializer,
)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/  → JWT + datos del usuario."""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """GET /api/auth/me/  → datos del usuario autenticado."""
    return Response(UsuarioSerializer(request.user).data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_perfil(request):
    """PATCH /api/auth/perfil/
    Permite al usuario logueado cambiar SOLO su email y/o contraseña.

    body: {"email": "...", "password_actual": "...", "password_nueva": "..."}
    - Para cambiar la contraseña hay que enviar la actual (verificación).
    - Email y contraseña son ambos opcionales (se cambia lo que se mande).
    """
    user = request.user
    email = request.data.get('email')
    password_actual = request.data.get('password_actual')
    password_nueva = request.data.get('password_nueva')

    cambios = []

    # --- Cambio de email ---
    if email is not None and email != user.email:
        user.email = email
        cambios.append('email')

    # --- Cambio de contraseña ---
    if password_nueva:
        if not password_actual:
            return Response(
                {'detail': 'Para cambiar la contraseña debés ingresar la actual.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(password_actual):
            return Response(
                {'detail': 'La contraseña actual es incorrecta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password_nueva) < 6:
            return Response(
                {'detail': 'La nueva contraseña debe tener al menos 6 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password_nueva)
        cambios.append('contraseña')

    if not cambios:
        return Response(
            {'detail': 'No se indicó ningún cambio.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.save()
    return Response({
        'detail': f"Se actualizó: {', '.join(cambios)}.",
        'user': UsuarioSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_alumnos(request):
    """GET /api/usuarios/alumnos/  → lista de alumnos.
    Lo usan profesores (para cargar notas/asistencias) y administrativos."""
    alumnos = Usuario.objects.filter(rol=Usuario.Rol.ALUMNO, is_active=True) \
                             .order_by('last_name', 'first_name')
    return Response(UsuarioSerializer(alumnos, many=True).data)


class UsuarioViewSet(viewsets.ModelViewSet):
    """CRUD de usuarios (alumnos y profesores). Solo para administrativos.
    Implementa el RFC8 - Gestión de usuarios."""
    serializer_class = UsuarioCrearSerializer
    permission_classes = [EsAdministrativo]

    def get_queryset(self):
        # Lista alumnos, profesores y administrativos.
        qs = Usuario.objects.all().order_by('rol', 'last_name', 'first_name')
        # Filtro opcional por rol: /api/usuarios/?rol=PROFESOR
        rol = self.request.query_params.get('rol')
        if rol:
            qs = qs.filter(rol=rol)
        return qs
