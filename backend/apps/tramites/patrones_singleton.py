"""
PATRÓN DE DISEÑO: SINGLETON
===========================

Problema que resuelve:
    Hay datos institucionales que son únicos en todo el sistema y que se
    usan en varios lugares: el nombre de la facultad, el subtítulo del
    sistema y las autoridades que firman los certificados. Si cada módulo
    los definiera por su cuenta, terminaríamos con valores repetidos y
    difíciles de mantener (cambiar el nombre de una autoridad obligaría a
    tocar varios archivos).

Solución (Singleton):
    Garantizamos que exista UNA sola instancia de la configuración
    institucional en toda la aplicación. Cualquier parte del sistema que
    la pida obtiene siempre el mismo objeto, con la misma información. Si
    hay que cambiar un dato, se cambia en un único lugar.

Estructura:
    ConfiguracionInstitucional  -> clase con __new__ sobrescrito que
                                   devuelve siempre la misma instancia.
    configuracion()             -> función de acceso cómoda al singleton.
"""


class ConfiguracionInstitucional:
    """Configuración única (Singleton) de la institución.

    El truco está en sobrescribir __new__: la primera vez crea la
    instancia y la guarda en el atributo de clase `_instancia`; las
    veces siguientes devuelve esa misma instancia en lugar de crear una
    nueva. Así, sin importar cuántas veces se la instancie, siempre es
    el mismo objeto en memoria.
    """

    _instancia = None

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._inicializar()
        return cls._instancia

    def _inicializar(self):
        """Carga única de los datos. (En un sistema real podrían venir de
        la base de datos o de variables de entorno; acá los centralizamos
        en el singleton.)"""
        self.nombre_institucion = 'FACULTAD DE MEDICINA'
        self.subtitulo_sistema = 'Intranet Académica - Sistema de Gestión'

        # Autoridades FICTICIAS que firman los certificados.
        #   - firma: nombre que aparece como rúbrica (arriba de la línea)
        #   - cargo: cargo que aparece debajo de la línea
        self.firmante_izquierda = {
            'firma': 'Dra. Marta L. Giménez',
            'cargo': 'Secretaría Académica',
        }
        self.firmante_derecha = {
            'firma': 'Dr. Roberto A. Casas',
            'cargo': 'Decanato',
        }


def configuracion():
    """Devuelve la instancia única de configuración institucional."""
    return ConfiguracionInstitucional()
