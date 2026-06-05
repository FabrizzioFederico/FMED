"""
PATRÓN DE DISEÑO: COMPOSITE
===========================

Problema que resuelve:
    Un plan de estudios tiene una estructura de árbol:

        Plan de Estudio
        ├── Año 1
        │   ├── Materia: Anatomía I
        │   └── Materia: Biología Celular
        ├── Año 2
        │   └── Materia: Fisiología
        └── ...

    Queremos poder hacer operaciones sobre TODO el árbol (ej. "carga
    horaria total del plan") o sobre una rama ("carga horaria del año 2")
    sin escribir código distinto para cada caso.

Solución (Composite):
    Definimos una interfaz común (ComponentePlan) que implementan tanto
    las HOJAS (las materias, que no tienen hijos) como los COMPUESTOS
    (el plan y los años, que contienen otros componentes).
    El código cliente trata a un objeto individual y a una composición
    de objetos exactamente igual.

Estructura:
    ComponentePlan (interfaz)
        ├── MateriaHoja        (hoja: una materia)
        └── NodoComposite      (compuesto: agrupa hijos)
              usado como Plan completo y como cada Año
"""
from abc import ABC, abstractmethod


# ----------------------------------------------------------------------
# Componente: interfaz común a hojas y compuestos
# ----------------------------------------------------------------------
class ComponentePlan(ABC):
    """Interfaz común. Tanto una materia suelta como el plan entero
    responden a estos métodos, así el cliente los trata por igual."""

    @abstractmethod
    def carga_horaria_total(self) -> int:
        """Suma de carga horaria de este componente y sus hijos."""
        raise NotImplementedError

    @abstractmethod
    def cantidad_materias(self) -> int:
        """Cantidad de materias contenidas en este componente."""
        raise NotImplementedError

    @abstractmethod
    def mostrar(self, nivel: int = 0) -> str:
        """Representación en texto del árbol, indentada por nivel."""
        raise NotImplementedError


# ----------------------------------------------------------------------
# Hoja: una materia (no tiene hijos)
# ----------------------------------------------------------------------
class MateriaHoja(ComponentePlan):
    """Hoja del árbol: una materia individual."""

    def __init__(self, codigo: str, nombre: str, carga_horaria: int):
        self.codigo = codigo
        self.nombre = nombre
        self.carga_horaria = carga_horaria

    def carga_horaria_total(self) -> int:
        return self.carga_horaria

    def cantidad_materias(self) -> int:
        return 1

    def mostrar(self, nivel: int = 0) -> str:
        sangria = '  ' * nivel
        return f"{sangria}- {self.codigo} {self.nombre} ({self.carga_horaria} hs)"


# ----------------------------------------------------------------------
# Compuesto: un nodo que agrupa otros componentes
# ----------------------------------------------------------------------
class NodoComposite(ComponentePlan):
    """Compuesto del árbol: puede contener materias u otros nodos.
    Se usa tanto para el Plan completo como para cada Año."""

    def __init__(self, nombre: str):
        self.nombre = nombre
        self._hijos = []   # lista de ComponentePlan

    def agregar(self, componente: ComponentePlan):
        """Agrega un hijo (materia u otro nodo)."""
        self._hijos.append(componente)
        return self

    def quitar(self, componente: ComponentePlan):
        if componente in self._hijos:
            self._hijos.remove(componente)

    def hijos(self):
        return list(self._hijos)

    def carga_horaria_total(self) -> int:
        # Delega en cada hijo: la misma operación recorre todo el árbol.
        return sum(h.carga_horaria_total() for h in self._hijos)

    def cantidad_materias(self) -> int:
        return sum(h.cantidad_materias() for h in self._hijos)

    def mostrar(self, nivel: int = 0) -> str:
        sangria = '  ' * nivel
        lineas = [f"{sangria}{self.nombre} "
                  f"[{self.cantidad_materias()} materias, "
                  f"{self.carga_horaria_total()} hs]"]
        for hijo in self._hijos:
            lineas.append(hijo.mostrar(nivel + 1))
        return '\n'.join(lineas)


# ----------------------------------------------------------------------
# Constructor: arma el árbol Composite a partir de los modelos de Django
# ----------------------------------------------------------------------
def construir_arbol_plan(plan) -> NodoComposite:
    """Toma un objeto PlanEstudio de la base de datos y construye su
    árbol Composite: Plan → Años → Materias.

    Devuelve el NodoComposite raíz, listo para consultar carga horaria,
    cantidad de materias o imprimir la estructura completa.
    """
    raiz = NodoComposite(f"Plan: {plan.nombre}")

    # Agrupamos las materias del plan por año
    materias = plan.materias.all().order_by('anio', 'nombre')
    anios = {}
    for materia in materias:
        if materia.anio not in anios:
            nodo_anio = NodoComposite(f"Año {materia.anio}")
            anios[materia.anio] = nodo_anio
            raiz.agregar(nodo_anio)
        anios[materia.anio].agregar(
            MateriaHoja(materia.codigo, materia.nombre, materia.carga_horaria)
        )

    return raiz
