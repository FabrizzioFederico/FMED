"""
Inscripciones a cursada y a finales.
"""
from django.conf import settings
from django.db import models


class InscripcionCursada(models.Model):
    """Inscripción a una comisión (cursada de la materia)."""

    class Estado(models.TextChoices):
        ACTIVA = 'ACTIVA', 'Activa'
        REGULAR = 'REGULAR', 'Regular'  # cursada aprobada, habilitado a rendir final
        LIBRE = 'LIBRE', 'Libre'
        BAJA = 'BAJA', 'Baja'

    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='inscripciones_cursada',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    comision = models.ForeignKey(
        'academico.Comision', on_delete=models.PROTECT, related_name='inscripciones'
    )
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ACTIVA)

    class Meta:
        db_table = 'inscripcion_cursada'
        unique_together = ('alumno', 'comision')

    def __str__(self):
        return f"{self.alumno.username} → {self.comision} [{self.estado}]"

class InscripcionFinal(models.Model):
    """Inscripción a una mesa de examen final. RFC01 + caso de uso 9.1."""

    class Estado(models.TextChoices):
        INSCRIPTO = 'INSCRIPTO', 'Inscripto'
        AUSENTE = 'AUSENTE', 'Ausente'
        APROBADO = 'APROBADO', 'Aprobado'
        DESAPROBADO = 'DESAPROBADO', 'Desaprobado'
        BAJA = 'BAJA', 'Baja'

    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='inscripciones_final',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    mesa = models.ForeignKey(
        'academico.MesaExamen', on_delete=models.PROTECT, related_name='inscripciones'
    )
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.INSCRIPTO)
    codigo_comprobante = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'inscripcion_final'
        unique_together = ('alumno', 'mesa')

    def __str__(self):
        return f"{self.alumno.username} → {self.mesa} [{self.estado}]"