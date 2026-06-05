from rest_framework.permissions import BasePermission


class EsAlumno(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.es_alumno)


class EsProfesor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.es_profesor)


class EsAdministrativo(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.es_administrativo or request.user.is_staff)
        )
