"""
Servicios de trámites. Implementa el Caso de Uso 9.3:
verificación y aprobación de documentación del alumno.
"""
import secrets
from django.db import transaction
from django.utils import timezone

from apps.usuarios.models import LogAuditoria

from .models import Documento, Tramite, EstadoTramite


class TramiteError(Exception):
    pass


@transaction.atomic
def aprobar_documento(documento: Documento, administrativo) -> Documento:
    """Curso normal 9.3 paso 5."""
    documento.estado = EstadoTramite.APROBADO
    documento.fecha_revision = timezone.now()
    documento.revisado_por = administrativo
    documento.motivo_rechazo = ''
    documento.save()

    # Si el alumno tenía deuda documental y este era el último doc pendiente,
    # se levanta la deuda
    legajo = getattr(documento.alumno, 'legajo', None)
    if legajo and legajo.deuda_documental:
        pendientes = Documento.objects.filter(
            alumno=documento.alumno,
            estado__in=[EstadoTramite.PENDIENTE, EstadoTramite.RECHAZADO],
        ).exists()
        if not pendientes:
            legajo.deuda_documental = False
            legajo.save(update_fields=['deuda_documental'])

    LogAuditoria.objects.create(
        usuario=administrativo,
        accion='APROBAR_DOCUMENTO',
        detalle=f"Documento {documento.id} - alumno {documento.alumno.username}",
    )
    return documento


@transaction.atomic
def rechazar_documento(documento: Documento, administrativo, motivo: str) -> Documento:
    """Curso alternativo 9.3 paso 4.1-4.3."""
    if not motivo or not motivo.strip():
        raise TramiteError("Debe indicarse un motivo de rechazo.")

    documento.estado = EstadoTramite.RECHAZADO
    documento.fecha_revision = timezone.now()
    documento.revisado_por = administrativo
    documento.motivo_rechazo = motivo
    documento.save()

    # Bloquear inscripciones del alumno hasta que regularice
    legajo = getattr(documento.alumno, 'legajo', None)
    if legajo:
        legajo.deuda_documental = True
        legajo.save(update_fields=['deuda_documental'])

    LogAuditoria.objects.create(
        usuario=administrativo,
        accion='RECHAZAR_DOCUMENTO',
        detalle=f"Documento {documento.id} - motivo: {motivo[:120]}",
    )
    return documento


@transaction.atomic
def resolver_tramite(tramite: Tramite, administrativo, aprobado: bool,
                     motivo: str = '') -> Tramite:
    """Resuelve un trámite (RFC10).
    Si se aprueba, genera un código de verificación tipo QR único."""
    tramite.administrativo = administrativo
    tramite.fecha_resolucion = timezone.now()
    if aprobado:
        tramite.estado = EstadoTramite.APROBADO
        tramite.codigo_qr_verificacion = secrets.token_urlsafe(24)
    else:
        if not motivo or not motivo.strip():
            raise TramiteError("Debe indicarse un motivo de rechazo.")
        tramite.estado = EstadoTramite.RECHAZADO
        tramite.motivo_rechazo = motivo
    tramite.save()

    LogAuditoria.objects.create(
        usuario=administrativo,
        accion='RESOLVER_TRAMITE',
        detalle=f"Trámite {tramite.id} - {tramite.estado}",
    )
    return tramite
