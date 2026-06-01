"""
Servicio de calificaciones. Implementa el Caso de Uso 9.2:
carga de notas, validación de rango (PERS-05), cierre de acta con firma digital.
"""
import hashlib
import secrets
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.usuarios.models import LogAuditoria

from .models import Acta, Calificacion


class ActaError(Exception):
    pass


class ActaCerradaError(ActaError):
    """Curso alternativo 6.1 del CU 9.2."""


class NotaFueraDeRangoError(ActaError):
    """Curso alternativo 3.1 del CU 9.2 - PERS-05."""


class ProfesorNoAutorizadoError(ActaError):
    """El profesor no es el que abrió el acta."""


@transaction.atomic
def cargar_nota(acta: Acta, alumno, nota, profesor, observaciones: str = '') -> Calificacion:
    """Carga una nota dentro de un acta provisoria.

    Reglas:
      - El acta no puede estar cerrada (curso alt 6.1).
      - La nota debe estar entre 0 y 10 (curso alt 3.1 + PERS-05).
      - Solo el profesor titular del acta puede cargar notas.
    """
    if acta.esta_cerrada:
        raise ActaCerradaError(
            "El acta ya fue cerrada. Debe solicitar rectificación al administrativo."
        )

    if acta.profesor_id != profesor.id:
        raise ProfesorNoAutorizadoError("Solo el profesor del acta puede cargar notas.")

    try:
        nota_dec = Decimal(str(nota))
    except (InvalidOperation, TypeError, ValueError):
        raise NotaFueraDeRangoError(f"Nota inválida: {nota}")

    if nota_dec < Decimal('0') or nota_dec > Decimal('10'):
        raise NotaFueraDeRangoError(
            f"La nota {nota_dec} está fuera del rango permitido (0 a 10)."
        )

    calificacion, creada = Calificacion.objects.update_or_create(
        acta=acta, alumno=alumno,
        defaults={'nota': nota_dec, 'observaciones': observaciones},
    )

    LogAuditoria.objects.create(
        usuario=profesor,
        accion='CARGA_NOTA',
        detalle=f"Acta {acta.id} - alumno {alumno.username} - nota {nota_dec}",
    )
    return calificacion


@transaction.atomic
def cerrar_acta(acta: Acta, profesor) -> Acta:
    """Cierra el acta y le asigna una firma digital (hash + nonce).
    Una vez cerrada, no permite ediciones (paso 6 del CU 9.2)."""
    if acta.esta_cerrada:
        raise ActaCerradaError("El acta ya está cerrada.")

    if acta.profesor_id != profesor.id:
        raise ProfesorNoAutorizadoError("Solo el profesor del acta puede cerrarla.")

    # Generar "firma digital" = hash del contenido + nonce
    nonce = secrets.token_hex(8)
    contenido = ''.join(
        f"{c.alumno_id}:{c.nota};" for c in acta.calificaciones.order_by('alumno_id')
    )
    firma = hashlib.sha256(
        f"{acta.id}|{contenido}|{nonce}|{profesor.id}".encode()
    ).hexdigest()

    acta.estado = Acta.Estado.CERRADA
    acta.fecha_cierre = timezone.now()
    acta.firma_digital = firma
    acta.save(update_fields=['estado', 'fecha_cierre', 'firma_digital'])

    # --- PATRÓN OBSERVER ---
    # En vez de meter todas las reacciones acá adentro, el acta se vuelve
    # un "sujeto observable" y los observadores reaccionan por su cuenta:
    #   - ObservadorInscripciones → actualiza el estado de las inscripciones
    #   - ObservadorAuditoria     → escribe en el log de auditoría
    #   - ObservadorNotificaciones → avisa a los alumnos
    # Sumar una reacción nueva = suscribir un observador más, sin tocar esto.
    from .patrones_observer import (
        SujetoActa, ObservadorInscripciones,
        ObservadorAuditoria, ObservadorNotificaciones,
    )
    sujeto = SujetoActa(acta)
    sujeto.suscribir(ObservadorInscripciones())
    sujeto.suscribir(ObservadorAuditoria())
    sujeto.suscribir(ObservadorNotificaciones())
    sujeto.notificar('ACTA_CERRADA', {'profesor': profesor})

    return acta
