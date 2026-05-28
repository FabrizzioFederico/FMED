from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    

    class Rol(models.TextChoices):
        ALUMNO = 'ALUMNO', 'Alumno'
        PROFESOR = 'PROFESOR', 'Profesor'
        ADMINISTRATIVO = 'ADMINISTRATIVO', 'Administrativo'

    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.ALUMNO,
    )
    dni = models.CharField(max_length=15, unique=True, null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    @property
    def es_alumno(self):
        return self.rol == self.Rol.ALUMNO

    @property
    def es_profesor(self):
        return self.rol == self.Rol.PROFESOR

    @property
    def es_administrativo(self):
        return self.rol == self.Rol.ADMINISTRATIVO


class LegajoAlumno(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='legajo',
        limit_choices_to={'rol': Usuario.Rol.ALUMNO},
    )
    numero_legajo = models.CharField(max_length=20, unique=True)
    fecha_ingreso = models.DateField(auto_now_add=True)
    deuda_documental = models.BooleanField(
        default=False,
        help_text="Si está en True bloquea inscripciones (RFC01 curso alt 2.2)",
    )

    class Meta:
        db_table = 'legajo_alumno'

    def __str__(self):
        return f"Legajo {self.numero_legajo} - {self.usuario.get_full_name() or self.usuario.username}"


class LogAuditoria(models.Model):
    usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, related_name='logs'
    )
    accion = models.CharField(max_length=100)
    detalle = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'log_auditoria'
        ordering = ['-fecha']

    def __str__(self):
        return f"[{self.fecha:%Y-%m-%d %H:%M}] {self.usuario} - {self.accion}"
