"""
PATRÓN DE DISEÑO: OBSERVER
==========================

Problema que resuelve:
    Cuando un profesor cierra un acta de examen, hay que disparar varias
    acciones independientes: actualizar el estado de las inscripciones a
    final, registrar el hecho en el log de auditoría, (a futuro) enviar
    notificaciones, etc. Si metiéramos todo eso dentro de `cerrar_acta`,
    esa función crecería sin control y quedaría acoplada a todo.

Solución (Observer):
    El acta (el "sujeto" / observable) mantiene una lista de "observadores".
    Cuando ocurre el evento (acta cerrada), el sujeto notifica a todos los
    observadores suscriptos. Cada observador reacciona por su cuenta sin
    que el sujeto sepa qué hacen. Sumar una reacción nueva = agregar un
    observador, sin tocar el código del sujeto.

Estructura:
    Observador (interfaz)
        ├── ObservadorInscripciones  → actualiza estados de inscripción
        ├── ObservadorAuditoria      → escribe en el log
        └── ObservadorNotificaciones → deja un aviso (ejemplo extensible)

    SujetoActa (observable) → registra observadores y los notifica.
"""
from abc import ABC, abstractmethod


# ----------------------------------------------------------------------
# Interfaz Observador
# ----------------------------------------------------------------------
class Observador(ABC):
    """Interfaz que deben cumplir todos los observadores."""

    @abstractmethod
    def actualizar(self, acta, evento: str, datos: dict):
        """Se invoca cuando el sujeto emite un evento.

        - acta:   el acta que disparó el evento
        - evento: nombre del evento (ej. 'ACTA_CERRADA')
        - datos:  información adicional (ej. el profesor que la cerró)
        """
        raise NotImplementedError


# ----------------------------------------------------------------------
# Sujeto observable
# ----------------------------------------------------------------------
class SujetoActa:
    """Sujeto (observable) del patrón Observer.

    Mantiene la lista de observadores y los notifica cuando ocurre
    un evento relevante sobre el acta.
    """

    def __init__(self, acta):
        self.acta = acta
        self._observadores = []

    def suscribir(self, observador: Observador):
        """Agrega un observador a la lista de notificación."""
        if observador not in self._observadores:
            self._observadores.append(observador)

    def desuscribir(self, observador: Observador):
        """Quita un observador de la lista."""
        if observador in self._observadores:
            self._observadores.remove(observador)

    def notificar(self, evento: str, datos: dict = None):
        """Avisa a TODOS los observadores que ocurrió un evento."""
        datos = datos or {}
        for observador in self._observadores:
            observador.actualizar(self.acta, evento, datos)


# ----------------------------------------------------------------------
# Observadores concretos
# ----------------------------------------------------------------------
class ObservadorInscripciones(Observador):
    """Al cerrarse el acta, actualiza el estado de las inscripciones
    a final: APROBADO si la nota es >= 4, DESAPROBADO si es menor."""

    def actualizar(self, acta, evento: str, datos: dict):
        if evento != 'ACTA_CERRADA' or not acta.mesa:
            return
        from apps.inscripciones.models import InscripcionFinal
        for calificacion in acta.calificaciones.all():
            nuevo_estado = (
                InscripcionFinal.Estado.APROBADO
                if calificacion.nota >= 4
                else InscripcionFinal.Estado.DESAPROBADO
            )
            InscripcionFinal.objects.filter(
                alumno=calificacion.alumno, mesa=acta.mesa
            ).update(estado=nuevo_estado)


class ObservadorAuditoria(Observador):
    """Al cerrarse el acta, registra el evento en el log de auditoría."""

    def actualizar(self, acta, evento: str, datos: dict):
        if evento != 'ACTA_CERRADA':
            return
        from apps.usuarios.models import LogAuditoria
        profesor = datos.get('profesor')
        LogAuditoria.objects.create(
            usuario=profesor,
            accion='CIERRE_ACTA',
            detalle=(
                f"Acta #{acta.id} cerrada. "
                f"Firma: {(acta.firma_digital or '')[:16]}... "
                f"Calificaciones: {acta.calificaciones.count()}"
            ),
        )


class ObservadorNotificaciones(Observador):
    """Ejemplo de observador extensible: deja registrado un aviso.
    En un sistema real acá se enviaría un email o una notificación push.
    Se incluye para mostrar lo fácil que es sumar reacciones nuevas."""

    def actualizar(self, acta, evento: str, datos: dict):
        if evento != 'ACTA_CERRADA':
            return
        # Aquí iría el envío real de notificaciones a los alumnos.
        # Lo dejamos como print para no acoplar a un servicio de mail.
        cantidad = acta.calificaciones.count()
        print(f"[Notificaciones] Acta #{acta.id} cerrada: "
              f"{cantidad} alumno(s) pueden consultar su nota.")
