"""
PATRÓN DE DISEÑO: STRATEGY
==========================

Problema que resuelve:
    La condición final de un alumno en una materia (si PROMOCIONA, queda
    REGULAR o queda LIBRE) no se calcula siempre igual. Una materia puede
    promocionar con 7, otra con 8; algunas exigen 75% de asistencia, otras 80%.
    Si pusiéramos todos esos "if" mezclados en una sola función, sería
    imposible de mantener.

Solución (Strategy):
    Definimos una familia de algoritmos intercambiables ("estrategias"),
    cada uno encapsulado en su propia clase con la misma interfaz.
    El código cliente elige una estrategia y la usa sin conocer su detalle
    interno. Agregar una nueva forma de evaluar = agregar una clase nueva,
    sin tocar el resto.

Estructura:
    EstrategiaEvaluacion (interfaz / clase base abstracta)
        ├── EvaluacionEstandar      (promociona con 7, regular con 4)
        ├── EvaluacionEstricta      (promociona con 8, exige más asistencia)
        └── EvaluacionPromocionDirecta (sin final si promociona)
"""
from abc import ABC, abstractmethod
from decimal import Decimal


# ----------------------------------------------------------------------
# Objeto simple con los datos de entrada para evaluar
# ----------------------------------------------------------------------
class DesempenoAlumno:
    """Agrupa los datos necesarios para evaluar la condición del alumno."""

    def __init__(self, promedio_notas, porcentaje_asistencia, rindio_final=False,
                 nota_final=None):
        self.promedio_notas = Decimal(str(promedio_notas))
        self.porcentaje_asistencia = Decimal(str(porcentaje_asistencia))
        self.rindio_final = rindio_final
        self.nota_final = Decimal(str(nota_final)) if nota_final is not None else None


# ----------------------------------------------------------------------
# Interfaz Strategy (clase base abstracta)
# ----------------------------------------------------------------------
class EstrategiaEvaluacion(ABC):
    """Interfaz común a todas las estrategias de evaluación.

    Cualquier estrategia concreta debe implementar `evaluar`, que recibe
    el desempeño del alumno y devuelve una de las condiciones:
    'PROMOCIONADO', 'REGULAR' o 'LIBRE'.
    """

    @abstractmethod
    def evaluar(self, desempeno: DesempenoAlumno) -> str:
        """Devuelve la condición final del alumno."""
        raise NotImplementedError

    @abstractmethod
    def descripcion(self) -> str:
        """Texto explicativo de cómo evalúa esta estrategia."""
        raise NotImplementedError


# ----------------------------------------------------------------------
# Estrategias concretas
# ----------------------------------------------------------------------
class EvaluacionEstandar(EstrategiaEvaluacion):
    """Criterio estándar:
        - Promociona si promedio >= 7 y asistencia >= 75%.
        - Queda regular si promedio >= 4 y asistencia >= 75%.
        - Si no, queda libre.
    """

    def evaluar(self, desempeno: DesempenoAlumno) -> str:
        if desempeno.porcentaje_asistencia < Decimal('75'):
            return 'LIBRE'
        if desempeno.promedio_notas >= Decimal('7'):
            return 'PROMOCIONADO'
        if desempeno.promedio_notas >= Decimal('4'):
            return 'REGULAR'
        return 'LIBRE'

    def descripcion(self) -> str:
        return 'Estándar: promociona con 7, regular con 4, asistencia mínima 75%.'


class EvaluacionEstricta(EstrategiaEvaluacion):
    """Criterio estricto (materias troncales):
        - Promociona si promedio >= 8 y asistencia >= 80%.
        - Queda regular si promedio >= 6 y asistencia >= 80%.
        - Si no, queda libre.
    """

    def evaluar(self, desempeno: DesempenoAlumno) -> str:
        if desempeno.porcentaje_asistencia < Decimal('80'):
            return 'LIBRE'
        if desempeno.promedio_notas >= Decimal('8'):
            return 'PROMOCIONADO'
        if desempeno.promedio_notas >= Decimal('6'):
            return 'REGULAR'
        return 'LIBRE'

    def descripcion(self) -> str:
        return 'Estricta: promociona con 8, regular con 6, asistencia mínima 80%.'


class EvaluacionPromocionDirecta(EstrategiaEvaluacion):
    """Criterio de promoción directa (sin examen final):
        - Promociona si promedio >= 6 y asistencia >= 70%.
        - En cualquier otro caso queda libre (no hay condición regular).
    """

    def evaluar(self, desempeno: DesempenoAlumno) -> str:
        if (desempeno.promedio_notas >= Decimal('6')
                and desempeno.porcentaje_asistencia >= Decimal('70')):
            return 'PROMOCIONADO'
        return 'LIBRE'

    def descripcion(self) -> str:
        return 'Promoción directa: promociona con 6 y 70% de asistencia, o queda libre.'


# ----------------------------------------------------------------------
# Contexto: usa una estrategia sin conocer su implementación concreta
# ----------------------------------------------------------------------
class EvaluadorCondicion:
    """Contexto del patrón Strategy.

    Mantiene una referencia a una estrategia y delega en ella el cálculo.
    La estrategia puede cambiarse en tiempo de ejecución con `set_estrategia`.
    """

    def __init__(self, estrategia: EstrategiaEvaluacion = None):
        self._estrategia = estrategia or EvaluacionEstandar()

    def set_estrategia(self, estrategia: EstrategiaEvaluacion):
        """Permite intercambiar la estrategia en caliente."""
        self._estrategia = estrategia

    def evaluar(self, desempeno: DesempenoAlumno) -> str:
        return self._estrategia.evaluar(desempeno)

    def explicar(self) -> str:
        return self._estrategia.descripcion()


# Registro de estrategias disponibles, para elegirlas por nombre
ESTRATEGIAS = {
    'ESTANDAR': EvaluacionEstandar,
    'ESTRICTA': EvaluacionEstricta,
    'PROMOCION_DIRECTA': EvaluacionPromocionDirecta,
}


def obtener_estrategia(nombre: str) -> EstrategiaEvaluacion:
    """Fábrica simple: devuelve una instancia de la estrategia pedida.
    Si el nombre no existe, devuelve la estándar."""
    clase = ESTRATEGIAS.get((nombre or '').upper(), EvaluacionEstandar)
    return clase()
