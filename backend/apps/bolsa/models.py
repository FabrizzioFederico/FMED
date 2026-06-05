"""
Bolsa de trabajo: instituciones de salud publican ofertas (residencias, pasantías)
y los alumnos del último año pueden postularse.
RNFC2: la bolsa debe actualizarse cada semana.
"""
from django.conf import settings
from django.db import models


class Institucion(models.Model):
    """Hospital, clínica o centro de salud que publica ofertas."""
    nombre = models.CharField(max_length=150)
    cuit = models.CharField(max_length=15, blank=True)
    email_contacto = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.CharField(max_length=200, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'institucion'

    def __str__(self):
        return self.nombre


class Oferta(models.Model):
    """Oferta laboral publicada por una institución."""

    class Tipo(models.TextChoices):
        RESIDENCIA = 'RESIDENCIA', 'Residencia'
        PASANTIA = 'PASANTIA', 'Pasantía'
        EMPLEO = 'EMPLEO', 'Empleo'

    class Estado(models.TextChoices):
        ABIERTA = 'ABIERTA', 'Abierta'
        CERRADA = 'CERRADA', 'Cerrada'

    institucion = models.ForeignKey(Institucion, on_delete=models.CASCADE,
                                    related_name='ofertas')
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=15, choices=Tipo.choices)
    requisitos = models.TextField(blank=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices,
                              default=Estado.ABIERTA)

    class Meta:
        db_table = 'oferta'
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return f"{self.titulo} - {self.institucion.nombre}"

    def vencida(self):
        """True si la oferta tiene fecha de cierre y esa fecha ya pasó."""
        from django.utils import timezone
        if not self.fecha_cierre:
            return False
        return self.fecha_cierre < timezone.localdate()

    def cerrar_si_vencio(self):
        """Si la oferta venció y todavía figura abierta, la cierra.
        Devuelve True si efectivamente la cerró."""
        if self.estado == self.Estado.ABIERTA and self.vencida():
            self.estado = self.Estado.CERRADA
            self.save(update_fields=['estado'])
            return True
        return False

    @classmethod
    def cerrar_vencidas(cls):
        """Cierra automáticamente todas las ofertas cuya fecha de cierre
        ya pasó. Se llama cada vez que se listan las ofertas, así el
        cierre es automático sin necesidad de un cron/tarea programada."""
        from django.utils import timezone
        cls.objects.filter(
            estado=cls.Estado.ABIERTA,
            fecha_cierre__lt=timezone.localdate(),
        ).update(estado=cls.Estado.CERRADA)


class Postulacion(models.Model):
    """Postulación de un alumno a una oferta."""

    class Estado(models.TextChoices):
        POSTULADO = 'POSTULADO', 'Postulado'
        PRESELECCIONADO = 'PRESELECCIONADO', 'Preseleccionado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        ACEPTADO = 'ACEPTADO', 'Aceptado'

    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='postulaciones',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    oferta = models.ForeignKey(Oferta, on_delete=models.CASCADE,
                               related_name='postulaciones')
    fecha_postulacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=Estado.choices,
                              default=Estado.POSTULADO)
    mensaje = models.TextField(blank=True)

    class Meta:
        db_table = 'postulacion'
        unique_together = ('alumno', 'oferta')
        ordering = ['-fecha_postulacion']

    def __str__(self):
        return f"{self.alumno.username} → {self.oferta.titulo}"
