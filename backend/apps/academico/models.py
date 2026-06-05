"""
Entidades académicas: Plan de estudios, Materia, Correlativa, Periodo Lectivo,
Comisión, Aula, Mesa de examen.

PERS-03: todos los modelos heredan ID autoincremental (BigAutoField).
PERS-04: campos obligatorios → null=False (default Django).
"""
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class PlanEstudio(models.Model):
    nombre = models.CharField(max_length=120)
    anio_vigencia = models.PositiveIntegerField()
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'plan_estudio'

    def __str__(self):
        return f"{self.nombre} ({self.anio_vigencia})"


class Materia(models.Model):
    class Regimen(models.TextChoices):
        ANUAL = 'ANUAL', 'Anual'
        CUATRIMESTRAL = 'CUATRIMESTRAL', 'Cuatrimestral'

    plan = models.ForeignKey(PlanEstudio, on_delete=models.PROTECT, related_name='materias')
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=150)
    anio = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    regimen = models.CharField(max_length=15, choices=Regimen.choices, default=Regimen.CUATRIMESTRAL)
    carga_horaria = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'materia'
        ordering = ['anio', 'nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Correlativa(models.Model):
    """Correlativa requerida para cursar o rendir una materia.
    Si una materia anual se reprueba, las correlativas se evalúan al inscribirse."""

    class Tipo(models.TextChoices):
        CURSADA = 'CURSADA', 'Para cursar (regularizada)'
        FINAL = 'FINAL', 'Para rendir final (aprobada)'

    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='correlativas')
    requiere = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='requerida_por')
    tipo = models.CharField(max_length=10, choices=Tipo.choices)

    class Meta:
        db_table = 'correlativa'
        unique_together = ('materia', 'requiere', 'tipo')

    def __str__(self):
        return f"{self.materia.codigo} requiere {self.requiere.codigo} ({self.tipo})"


class PeriodoLectivo(models.Model):
    """RFC9 - calendarios académicos."""
    nombre = models.CharField(max_length=80)   # ej: "1er Cuatrimestre 2026"
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    inscripciones_abiertas = models.BooleanField(default=False)

    class Meta:
        db_table = 'periodo_lectivo'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return self.nombre


class Aula(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    capacidad = models.PositiveIntegerField(default=30)

    class Meta:
        db_table = 'aula'

    def __str__(self):
        return self.nombre


class Comision(models.Model):
    """RFC7 - aulas, horarios, cupos y docentes asignados."""
    materia = models.ForeignKey(Materia, on_delete=models.PROTECT, related_name='comisiones')
    periodo = models.ForeignKey(PeriodoLectivo, on_delete=models.PROTECT, related_name='comisiones')
    nombre = models.CharField(max_length=50)  # ej: "Comisión A"
    aula = models.ForeignKey(Aula, on_delete=models.SET_NULL, null=True, blank=True)
    horario = models.CharField(max_length=120)  # ej: "Lun y Mie 18-22"
    cupo = models.PositiveIntegerField(default=40)
    profesores = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'rol': 'PROFESOR'},
        related_name='comisiones_dictadas',
        blank=True,
    )

    class Meta:
        db_table = 'comision'

    def __str__(self):
        return f"{self.materia.codigo} - {self.nombre} ({self.periodo})"

    def lugares_libres(self):
        from apps.inscripciones.models import InscripcionCursada
        ocupados = InscripcionCursada.objects.filter(
            comision=self, estado=InscripcionCursada.Estado.ACTIVA
        ).count()
        return max(self.cupo - ocupados, 0)


class MesaExamen(models.Model):
    """Mesa para rendir final de una materia."""
    materia = models.ForeignKey(Materia, on_delete=models.PROTECT, related_name='mesas')
    fecha = models.DateTimeField()
    cupo = models.PositiveIntegerField(default=50)
    cerrada = models.BooleanField(default=False)
    profesores = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'rol': 'PROFESOR'},
        related_name='mesas_tribunal',
        blank=True,
    )

    class Meta:
        db_table = 'mesa_examen'
        ordering = ['fecha']

    def __str__(self):
        return f"Final {self.materia.codigo} - {self.fecha:%d/%m/%Y %H:%M}"

    def lugares_libres(self):
        from apps.inscripciones.models import InscripcionFinal
        ocupados = InscripcionFinal.objects.filter(
            mesa=self, estado=InscripcionFinal.Estado.INSCRIPTO
        ).count()
        return max(self.cupo - ocupados, 0)
