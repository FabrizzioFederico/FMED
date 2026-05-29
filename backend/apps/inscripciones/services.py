"""
Servicio de inscripciones — implementa el Caso de Uso 9.1 del SRS.

Excepciones específicas para distinguir cada curso alternativo:
  - CorrelativaFaltanteError  (curso alternativo 1.1)
  - DeudaDocumentalError      (curso alternativo 2.2)
  - SolapamientoHorarioError  (paso 4)
  - SinCupoError              (paso 6)
  - MateriaNoRegularError     (precondición)
"""
import secrets
import string
from django.db import transaction
from django.utils import timezone

from apps.academico.models import Correlativa, MesaExamen
from apps.usuarios.models import LogAuditoria

from .models import InscripcionCursada, InscripcionFinal


# ----------------------- Excepciones -----------------------

class InscripcionError(Exception):
    """Error genérico al inscribir."""


class CorrelativaFaltanteError(InscripcionError):
    """Curso alternativo 1.1 del CU 9.1."""


class DeudaDocumentalError(InscripcionError):
    """Curso alternativo 2.2 del CU 9.1."""


class SolapamientoHorarioError(InscripcionError):
    """Paso 4 del curso normal."""


class SinCupoError(InscripcionError):
    """Paso 6: no quedan cupos."""


class MateriaNoRegularError(InscripcionError):
    """Precondición: debe ser regular en la materia para rendir final."""


class MesaCerradaError(InscripcionError):
    """La mesa ya está cerrada."""


# ----------------------- Helpers -----------------------

def _generar_codigo_comprobante() -> str:
    """Genera un código alfanumérico único de 12 caracteres."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(12))


def _alumno_es_regular_en(alumno, materia) -> bool:
    """Verifica que el alumno haya regularizado la materia."""
    return InscripcionCursada.objects.filter(
        alumno=alumno,
        comision__materia=materia,
        estado=InscripcionCursada.Estado.REGULAR,
    ).exists()


def _alumno_aprobo_final_de(alumno, materia) -> bool:
    """Verifica que el alumno haya aprobado el final."""
    return InscripcionFinal.objects.filter(
        alumno=alumno,
        mesa__materia=materia,
        estado=InscripcionFinal.Estado.APROBADO,
    ).exists()


def _correlativas_faltantes_para_final(alumno, materia):
    """Lista de materias que el alumno todavía no tiene aprobadas y son
    correlativas de tipo FINAL de la materia recibida."""
    correlativas = Correlativa.objects.filter(
        materia=materia, tipo=Correlativa.Tipo.FINAL
    ).select_related('requiere')
    faltantes = []
    for c in correlativas:
        if not _alumno_aprobo_final_de(alumno, c.requiere):
            faltantes.append(c.requiere)
    return faltantes


def _hay_solapamiento(alumno, mesa):
    """Verifica si el alumno ya tiene otra mesa el mismo día/hora.
    Definimos solapamiento como misma fecha (mismo día calendario)."""
    return InscripcionFinal.objects.filter(
        alumno=alumno,
        mesa__fecha__date=mesa.fecha.date(),
        estado=InscripcionFinal.Estado.INSCRIPTO,
    ).exclude(mesa=mesa).exists()


# ----------------------- Servicio principal -----------------------

@transaction.atomic
def inscribir_alumno_a_final(alumno, mesa: MesaExamen) -> InscripcionFinal:
    """Implementa el Caso de Uso 9.1.

    Valida en orden:
      0. Precondición: la mesa no esté cerrada.
      1. Precondición: el alumno sea regular en la materia.
      2. Curso alt 1.1: correlativas de final cumplidas.
      3. Curso alt 2.2: legajo sin deuda documental.
      4. Paso 4: no haya solapamiento horario.
      5. Paso 6: queden cupos.

    Devuelve la InscripcionFinal creada.
    """
    if mesa.cerrada:
        raise MesaCerradaError("La mesa de examen ya fue cerrada.")

    # 1. Regularidad
    if not _alumno_es_regular_en(alumno, mesa.materia):
        raise MateriaNoRegularError(
            f"No estás registrado como regular en {mesa.materia}."
        )

    # 2. Correlativas (curso alternativo 1.1)
    faltantes = _correlativas_faltantes_para_final(alumno, mesa.materia)
    if faltantes:
        codigos = ', '.join(m.codigo for m in faltantes)
        raise CorrelativaFaltanteError(
            f"Te faltan correlativas de final: {codigos}."
        )

    # 3. Deuda documental (curso alternativo 2.2)
    legajo = getattr(alumno, 'legajo', None)
    if legajo and legajo.deuda_documental:
        raise DeudaDocumentalError(
            "Tenés documentación pendiente de validar. "
            "Regularizá tu situación en el módulo de trámites."
        )

    # 4. Solapamiento horario (paso 4)
    if _hay_solapamiento(alumno, mesa):
        raise SolapamientoHorarioError(
            "Ya tenés otra inscripción a mesa en esa misma fecha."
        )

    # 5. Cupos (paso 6)
    if mesa.lugares_libres() <= 0:
        raise SinCupoError("La mesa de examen ya no tiene cupos disponibles.")

    # Generar código de comprobante único (paso 5)
    for _ in range(10):
        codigo = _generar_codigo_comprobante()
        if not InscripcionFinal.objects.filter(codigo_comprobante=codigo).exists():
            break
    else:
        raise InscripcionError("No se pudo generar un código de comprobante único.")

    inscripcion = InscripcionFinal.objects.create(
        alumno=alumno,
        mesa=mesa,
        codigo_comprobante=codigo,
        estado=InscripcionFinal.Estado.INSCRIPTO,
    )

    LogAuditoria.objects.create(
        usuario=alumno,
        accion='INSCRIPCION_FINAL',
        detalle=f"Mesa {mesa.id} - {mesa.materia.codigo} - Comprobante {codigo}",
    )
    return inscripcion


@transaction.atomic
def inscribir_alumno_a_cursada(alumno, comision) -> InscripcionCursada:
    """Inscribe al alumno a una comisión validando cupos y correlativas de cursada."""
    if comision.lugares_libres() <= 0:
        raise SinCupoError("La comisión no tiene cupos disponibles.")

    # Validar correlativas de cursada
    correlativas = Correlativa.objects.filter(
        materia=comision.materia, tipo=Correlativa.Tipo.CURSADA
    ).select_related('requiere')
    faltantes = []
    for c in correlativas:
        regular = _alumno_es_regular_en(alumno, c.requiere)
        aprobado = _alumno_aprobo_final_de(alumno, c.requiere)
        if not (regular or aprobado):
            faltantes.append(c.requiere)
    if faltantes:
        codigos = ', '.join(m.codigo for m in faltantes)
        raise CorrelativaFaltanteError(
            f"Te faltan correlativas para cursar: {codigos}."
        )

    legajo = getattr(alumno, 'legajo', None)
    if legajo and legajo.deuda_documental:
        raise DeudaDocumentalError("Tenés documentación pendiente de validar.")

    inscripcion, creada = InscripcionCursada.objects.get_or_create(
        alumno=alumno,
        comision=comision,
        defaults={'estado': InscripcionCursada.Estado.ACTIVA},
    )
    if not creada:
        raise InscripcionError("Ya estás inscripto en esa comisión.")

    LogAuditoria.objects.create(
        usuario=alumno,
        accion='INSCRIPCION_CURSADA',
        detalle=f"Comisión {comision.id} - {comision.materia.codigo}",
    )
    return inscripcion
