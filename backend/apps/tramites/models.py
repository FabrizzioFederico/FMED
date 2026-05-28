"""
Trámites académicos y documentos.

PERS-02: los archivos digitales se guardan en filesystem; la BD solo
almacena la ruta de acceso (FileField guarda el path como string).
"""
from django.conf import settings
from django.db import models


def documento_path(instance, filename):
    """Organiza uploads por usuario y tipo."""
    return f'documentos/usuario_{instance.alumno_id}/{instance.tipo}/{filename}'


class TipoTramite(models.TextChoices):
    CERT_ALUMNO_REGULAR = 'CERT_REGULAR', 'Certificado de alumno regular'
    CERT_MATERIAS = 'CERT_MATERIAS', 'Certificado de materias aprobadas'
    ANALITICO = 'ANALITICO', 'Analítico parcial'
    TITULO = 'TITULO', 'Solicitud de título'
    OTRO = 'OTRO', 'Otro'


class EstadoTramite(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente'
    EN_REVISION = 'EN_REVISION', 'En revisión'
    APROBADO = 'APROBADO', 'Aprobado'
    RECHAZADO = 'RECHAZADO', 'Rechazado'


class Tramite(models.Model):
    """RFC04 - el alumno solicita trámites académicos."""
    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tramites_solicitados',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    tipo = models.CharField(max_length=20, choices=TipoTramite.choices)
    estado = models.CharField(max_length=15, choices=EstadoTramite.choices,
                              default=EstadoTramite.PENDIENTE)
    descripcion = models.TextField(blank=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)
    administrativo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tramites_gestionados',
        limit_choices_to={'rol': 'ADMINISTRATIVO'},
    )
    motivo_rechazo = models.TextField(blank=True)
    codigo_qr_verificacion = models.CharField(max_length=64, blank=True)

    class Meta:
        db_table = 'tramite'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Trámite #{self.id} - {self.get_tipo_display()} - {self.estado}"


class TipoDocumento(models.TextChoices):
    DNI = 'DNI', 'DNI'
    TITULO_SECUNDARIO = 'TITULO_SEC', 'Título Secundario'
    CERTIFICADO_MEDICO = 'CERT_MED', 'Certificado médico'
    OTRO = 'OTRO', 'Otro'


class Documento(models.Model):
    """Documento que el alumno sube para validación.
    PERS-02: archivo en filesystem, FileField persiste el path."""
    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documentos',
        limit_choices_to={'rol': 'ALUMNO'},
    )
    tipo = models.CharField(max_length=20, choices=TipoDocumento.choices)
    archivo = models.FileField(upload_to=documento_path)
    estado = models.CharField(max_length=15, choices=EstadoTramite.choices,
                              default=EstadoTramite.PENDIENTE)
    fecha_subida = models.DateTimeField(auto_now_add=True)
    fecha_revision = models.DateTimeField(null=True, blank=True)
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='documentos_revisados',
        limit_choices_to={'rol': 'ADMINISTRATIVO'},
    )
    motivo_rechazo = models.TextField(blank=True)

    class Meta:
        db_table = 'documento'
        ordering = ['-fecha_subida']

    def __str__(self):
        return f"Doc #{self.id} - {self.tipo} - {self.alumno.username}"
