"""
Serializers de las entidades académicas, con validaciones de entrada.

Reglas aplicadas:
- Textos: no pueden quedar vacíos ni ser solo espacios.
- Códigos de materia: alfanuméricos, sin espacios.
- Números (año, carga horaria): positivos.
- Cupos (comisiones y mesas): entre 1 y 200.
- Fechas: deben estar entre HOY y el 31 de diciembre del año en curso.
"""
import re
import unicodedata
from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import (
    PlanEstudio, Materia, Correlativa, PeriodoLectivo,
    Aula, Comision, MesaExamen,
)

# Cupo máximo permitido en comisiones y mesas
CUPO_MAXIMO = 200


# ----------------------------------------------------------------------
# Funciones de validación reutilizables
# ----------------------------------------------------------------------
def validar_texto(value, campo, minimo=2):
    """El texto no puede estar vacío ni ser demasiado corto."""
    limpio = (value or '').strip()
    if len(limpio) < minimo:
        raise serializers.ValidationError(
            f'El campo {campo} debe tener al menos {minimo} caracteres.'
        )
    return limpio


def validar_cupo(value):
    """El cupo debe estar entre 1 y CUPO_MAXIMO."""
    if value < 1:
        raise serializers.ValidationError('El cupo debe ser al menos 1.')
    if value > CUPO_MAXIMO:
        raise serializers.ValidationError(
            f'El cupo no puede superar {CUPO_MAXIMO}.'
        )
    return value


def validar_fecha_en_rango(fecha_valor):
    """La fecha debe estar entre hoy y el 31/12 del año en curso."""
    if fecha_valor is None:
        return fecha_valor
    # Si viene con hora (datetime), tomamos solo la fecha
    solo_fecha = fecha_valor.date() if hasattr(fecha_valor, 'date') else fecha_valor
    hoy = timezone.localdate()
    fin_de_anio = date(hoy.year, 12, 31)
    if solo_fecha < hoy:
        raise serializers.ValidationError(
            f'La fecha no puede ser anterior a hoy ({hoy.strftime("%d/%m/%Y")}).'
        )
    if solo_fecha > fin_de_anio:
        raise serializers.ValidationError(
            f'La fecha no puede superar el {fin_de_anio.strftime("%d/%m/%Y")}.'
        )
    return fecha_valor


# ----------------------------------------------------------------------
# Validación del horario de comisión: solo días hábiles y 08:00-23:00
# ----------------------------------------------------------------------
HORA_MIN_COMISION = 8    # 08:00
HORA_MAX_COMISION = 23   # 23:00 (11 pm)

_DIAS_HABILES = {
    'LUN': 'Lun', 'LUNES': 'Lun',
    'MAR': 'Mar', 'MARTES': 'Mar',
    'MIE': 'Mié', 'MIER': 'Mié', 'MIERC': 'Mié', 'MIERCOLES': 'Mié',
    'JUE': 'Jue', 'JUEVES': 'Jue',
    'VIE': 'Vie', 'VIERNES': 'Vie',
}
_DIAS_FIN_SEMANA = {'SAB', 'SABADO', 'DOM', 'DOMINGO'}
_CONECTORES = {'Y', 'E', '-', ''}


def _normalizar_dia(token):
    """Pasa a mayúsculas y saca acentos para comparar sin importar tildes."""
    t = unicodedata.normalize('NFKD', token)
    t = ''.join(ch for ch in t if not unicodedata.combining(ch))
    return t.upper().strip(' .')


def validar_horario_comision(value):
    """Valida el horario de una comisión.

    Reglas:
      - Solo días hábiles (lunes a viernes). Sábado y domingo se rechazan.
      - Las horas deben estar entre las 08:00 y las 23:00 (11 pm).
      - La hora de inicio debe ser anterior a la de fin.

    Acepta formatos flexibles ('Lun y Mie 18-22', 'Vie 8-13') y devuelve
    el horario normalizado, ej: 'Lun, Mié 18:00-22:00'.
    """
    texto = (value or '').strip()
    if not texto:
        raise serializers.ValidationError('Indicá el horario de la comisión.')

    # Rango de horas al final: HH(:MM)? (- o 'a') HH(:MM)?
    patron = re.compile(
        r'(\d{1,2})(?::(\d{2}))?\s*(?:-|\u2013|a)\s*(\d{1,2})(?::(\d{2}))?\s*(?:hs|h)?\s*$',
        re.IGNORECASE,
    )
    m = patron.search(texto)
    if not m:
        raise serializers.ValidationError(
            "Formato inválido. Usá días + horario, ej: 'Lun, Mié 18:00-22:00'."
        )

    parte_dias = texto[:m.start()].strip(' ,')
    if not parte_dias:
        raise serializers.ValidationError(
            'Indicá al menos un día hábil (de lunes a viernes).'
        )

    # Días
    dias = []
    for tok in re.split(r'[,\s]+', parte_dias):
        norm = _normalizar_dia(tok)
        if norm in _CONECTORES:
            continue
        if norm in _DIAS_FIN_SEMANA:
            raise serializers.ValidationError(
                'Solo se permiten días hábiles (de lunes a viernes).'
            )
        if norm not in _DIAS_HABILES:
            raise serializers.ValidationError(
                f"Día no reconocido: '{tok}'. Usá Lun, Mar, Mié, Jue o Vie."
            )
        dia = _DIAS_HABILES[norm]
        if dia not in dias:
            dias.append(dia)
    if not dias:
        raise serializers.ValidationError(
            'Indicá al menos un día hábil (de lunes a viernes).'
        )

    # Horas
    h1, min1 = int(m.group(1)), int(m.group(2) or 0)
    h2, min2 = int(m.group(3)), int(m.group(4) or 0)
    for h, mi in ((h1, min1), (h2, min2)):
        if h > 23 or mi > 59:
            raise serializers.ValidationError('La hora ingresada no es válida.')

    inicio, fin = h1 * 60 + min1, h2 * 60 + min2
    if inicio < HORA_MIN_COMISION * 60:
        raise serializers.ValidationError(
            f'El horario no puede empezar antes de las {HORA_MIN_COMISION:02d}:00.'
        )
    if fin > HORA_MAX_COMISION * 60:
        raise serializers.ValidationError(
            f'El horario no puede terminar después de las {HORA_MAX_COMISION}:00 (11 pm).'
        )
    if inicio >= fin:
        raise serializers.ValidationError(
            'La hora de inicio debe ser anterior a la de fin.'
        )

    return f"{', '.join(dias)} {h1:02d}:{min1:02d}-{h2:02d}:{min2:02d}"


# ----------------------------------------------------------------------
# Plan de estudio
# ----------------------------------------------------------------------
class PlanEstudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanEstudio
        fields = '__all__'

    def validate_nombre(self, value):
        return validar_texto(value, 'nombre', minimo=3)

    def validate_anio_vigencia(self, value):
        hoy = timezone.localdate()
        if value < 1990 or value > hoy.year + 1:
            raise serializers.ValidationError(
                f'El año de vigencia debe estar entre 1990 y {hoy.year + 1}.'
            )
        return value


# ----------------------------------------------------------------------
# Correlativa
# ----------------------------------------------------------------------
class CorrelativaSerializer(serializers.ModelSerializer):
    requiere_codigo = serializers.CharField(source='requiere.codigo', read_only=True)
    requiere_nombre = serializers.CharField(source='requiere.nombre', read_only=True)

    class Meta:
        model = Correlativa
        fields = ['id', 'requiere', 'requiere_codigo', 'requiere_nombre', 'tipo']


# ----------------------------------------------------------------------
# Materia
# ----------------------------------------------------------------------
class MateriaSerializer(serializers.ModelSerializer):
    correlativas = CorrelativaSerializer(many=True, read_only=True)
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    regimen_display = serializers.CharField(source='get_regimen_display', read_only=True)

    class Meta:
        model = Materia
        fields = [
            'id', 'plan', 'plan_nombre', 'codigo', 'nombre', 'anio',
            'regimen', 'regimen_display', 'carga_horaria', 'correlativas',
        ]

    def validate_codigo(self, value):
        limpio = (value or '').strip().upper()
        if len(limpio) < 3:
            raise serializers.ValidationError(
                'El código debe tener al menos 3 caracteres.'
            )
        if not limpio.isalnum():
            raise serializers.ValidationError(
                'El código solo puede contener letras y números (sin espacios).'
            )
        # Código único
        qs = Materia.objects.filter(codigo=limpio)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe una materia con ese código.')
        return limpio

    def validate_nombre(self, value):
        return validar_texto(value, 'nombre', minimo=3)

    def validate_anio(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError('El año debe estar entre 1 y 10.')
        return value

    def validate_carga_horaria(self, value):
        if value < 0:
            raise serializers.ValidationError('La carga horaria no puede ser negativa.')
        if value > 1000:
            raise serializers.ValidationError('La carga horaria parece demasiado alta.')
        return value


# ----------------------------------------------------------------------
# Período lectivo
# ----------------------------------------------------------------------
class PeriodoLectivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoLectivo
        fields = '__all__'

    def validate_nombre(self, value):
        return validar_texto(value, 'nombre', minimo=3)

    def validate_fecha_inicio(self, value):
        return validar_fecha_en_rango(value)

    def validate_fecha_fin(self, value):
        return validar_fecha_en_rango(value)

    def validate(self, attrs):
        """La fecha de fin debe ser posterior a la de inicio."""
        inicio = attrs.get('fecha_inicio') or getattr(self.instance, 'fecha_inicio', None)
        fin = attrs.get('fecha_fin') or getattr(self.instance, 'fecha_fin', None)
        if inicio and fin and fin <= inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin debe ser posterior a la de inicio.'}
            )
        return attrs


# ----------------------------------------------------------------------
# Aula
# ----------------------------------------------------------------------
class AulaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aula
        fields = '__all__'

    def validate_nombre(self, value):
        limpio = validar_texto(value, 'nombre', minimo=2)
        qs = Aula.objects.filter(nombre=limpio)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un aula con ese nombre.')
        return limpio

    def validate_capacidad(self, value):
        if value < 1:
            raise serializers.ValidationError('La capacidad debe ser al menos 1.')
        if value > CUPO_MAXIMO:
            raise serializers.ValidationError(
                f'La capacidad no puede superar {CUPO_MAXIMO}.'
            )
        return value


# ----------------------------------------------------------------------
# Comisión
# ----------------------------------------------------------------------
class ComisionSerializer(serializers.ModelSerializer):
    materia_codigo = serializers.CharField(source='materia.codigo', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    aula_nombre = serializers.CharField(source='aula.nombre', read_only=True, default=None)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    lugares_libres = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comision
        fields = [
            'id', 'materia', 'materia_codigo', 'materia_nombre',
            'periodo', 'periodo_nombre',
            'nombre', 'aula', 'aula_nombre', 'horario', 'cupo',
            'lugares_libres', 'profesores',
        ]

    def validate_nombre(self, value):
        return validar_texto(value, 'nombre', minimo=2)

    def validate_horario(self, value):
        return validar_horario_comision(value)

    def validate_cupo(self, value):
        return validar_cupo(value)


# ----------------------------------------------------------------------
# Mesa de examen
# ----------------------------------------------------------------------
class MesaExamenSerializer(serializers.ModelSerializer):
    materia_codigo = serializers.CharField(source='materia.codigo', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    lugares_libres = serializers.IntegerField(read_only=True)

    class Meta:
        model = MesaExamen
        fields = [
            'id', 'materia', 'materia_codigo', 'materia_nombre',
            'fecha', 'cupo', 'cerrada', 'profesores', 'lugares_libres',
        ]

    def validate_fecha(self, value):
        return validar_fecha_en_rango(value)

    def validate_cupo(self, value):
        return validar_cupo(value)