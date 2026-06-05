"""
Modelos para calificaciones (parciales/finales), actas y asistencias.

PERS-05: validación de rango 0-10 con MinValueValidator y MaxValueValidator.
PERS-06: la asistencia usa auto_now_add para fecha/hora del servidor.
"""
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


def _validar_rango_nota(valor):
    """Refuerza la validación a nivel de modelo (PERS-05)."""
    if valor is None:
        return
    if valor < Decimal('0') or valor > Decimal('10'):
        raise ValidationError("La nota debe estar entre 0 y 10.")


class Acta(models.Model):
    """Acta de un examen final o parcial. Caso de uso 9.2.
    Una vez cerrada y firmada digitalmente, no permite ediciones."""

    class Tipo(models.TextChoices):
        PARCIAL = 'PARCIAL', 'Parcial'
        FINAL = 'FINAL', 'Final'

    class Estado(models.TextChoices):
        PROVISORIA = 'PROVISORIA', 'Provisoria'
        CERRADA = 'CERRADA', 'Cerrada'

    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='actas',
        limit_choices_to={'rol': 'PROFESOR'},
    )
    comision = models.ForeignKey(
        'academico.Comision', on_delete=models.PROTECT,
        null=True, blank=True, related_name='actas',
    )
    mesa = models.ForeignKey(
        'academico.MesaExamen', on_delete=models.PROTECT,
        null=True, blank=True, related_name='actas',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PROVISORIA)
    firma_digital = models.CharField(max_length=128, blank=True)

    class Meta:
        db_table = 'acta'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Acta {self.tipo} #{self.id} - {self.estado}"

    @property
    def esta_cerrada(self):
        return self.estado == self.Estado.CERRADA


class Calificacion(models.Model):
    """RFC02/RFC05 - nota individual asociada a un acta."""

    acta = models.ForeignKey(Acta, on_delete=models.CASCADE, related_name='calificaciones')
    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='calificaciones',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    nota = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('10'))],
        help_text="Nota en escala 0-10 (PERS-05)",
    )
    observaciones = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'calificacion'
        unique_together = ('acta', 'alumno')

    def clean(self):
        super().clean()
        _validar_rango_nota(self.nota)

    def save(self, *args, **kwargs):
        # full_clean fuerza la validación PERS-05 también desde código
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.alumno.username} - {self.nota}"


class Asistencia(models.Model):
    """RFC06 - asistencia individual por clase.
    PERS-06: fecha_hora con auto_now_add."""

    class Estado(models.TextChoices):
        PRESENTE = 'PRESENTE', 'Presente'
        AUSENTE = 'AUSENTE', 'Ausente'
        JUSTIFICADO = 'JUSTIFICADO', 'Justificado'

    comision = models.ForeignKey(
        'academico.Comision', on_delete=models.CASCADE, related_name='asistencias'
    )
    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='asistencias',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='asistencias_registradas',
        limit_choices_to={'rol': 'PROFESOR'},
    )
    fecha_clase = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)  # PERS-06
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.PRESENTE)

    class Meta:
        db_table = 'asistencia'
        unique_together = ('comision', 'alumno', 'fecha_clase')
        ordering = ['-fecha_clase']

    def __str__(self):
        return f"{self.alumno.username} - {self.fecha_clase} - {self.estado}"
