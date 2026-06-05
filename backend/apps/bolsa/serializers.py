"""
Serializers de la bolsa de trabajo, con validaciones de entrada.
"""
from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import Institucion, Oferta, Postulacion


def validar_texto(value, campo, minimo=3):
    """El texto no puede estar vacío ni ser demasiado corto."""
    limpio = (value or '').strip()
    if len(limpio) < minimo:
        raise serializers.ValidationError(
            f'El campo {campo} debe tener al menos {minimo} caracteres.'
        )
    return limpio


class InstitucionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institucion
        fields = '__all__'

    def validate_nombre(self, value):
        return validar_texto(value, 'nombre', minimo=3)

    def validate_cuit(self, value):
        """El CUIT es opcional, pero si se carga debe tener 11 dígitos."""
        if not value:
            return value
        # Aceptamos con o sin guiones; nos quedamos solo con los dígitos
        digitos = ''.join(c for c in value if c.isdigit())
        if len(digitos) != 11:
            raise serializers.ValidationError(
                'El CUIT debe tener 11 dígitos (ej: 30-12345678-9).'
            )
        return value

    def validate_telefono(self, value):
        if value and not ''.join(c for c in value if c.isdigit()):
            raise serializers.ValidationError('El teléfono no es válido.')
        return value


class OfertaSerializer(serializers.ModelSerializer):
    institucion_nombre = serializers.CharField(source='institucion.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_postulantes = serializers.SerializerMethodField()

    class Meta:
        model = Oferta
        fields = [
            'id', 'institucion', 'institucion_nombre',
            'titulo', 'descripcion', 'tipo', 'tipo_display',
            'requisitos', 'fecha_publicacion', 'fecha_cierre',
            'estado', 'estado_display', 'cantidad_postulantes',
        ]

    def get_cantidad_postulantes(self, obj):
        return obj.postulaciones.count()

    def validate_titulo(self, value):
        return validar_texto(value, 'título', minimo=5)

    def validate_descripcion(self, value):
        return validar_texto(value, 'descripción', minimo=10)

    def validate_fecha_cierre(self, value):
        """La fecha de cierre debe estar entre hoy y el 31/12 del año en curso."""
        if value is None:
            return value
        hoy = timezone.localdate()
        fin_de_anio = date(hoy.year, 12, 31)
        if value < hoy:
            raise serializers.ValidationError(
                f'La fecha de cierre no puede ser anterior a hoy '
                f'({hoy.strftime("%d/%m/%Y")}).'
            )
        if value > fin_de_anio:
            raise serializers.ValidationError(
                f'La fecha de cierre no puede superar el '
                f'{fin_de_anio.strftime("%d/%m/%Y")}.'
            )
        return value


class PostulacionSerializer(serializers.ModelSerializer):
    alumno_username = serializers.CharField(source='alumno.username', read_only=True)
    oferta_titulo = serializers.CharField(source='oferta.titulo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Postulacion
        fields = [
            'id', 'alumno', 'alumno_username', 'oferta', 'oferta_titulo',
            'fecha_postulacion', 'estado', 'estado_display', 'mensaje',
        ]
        read_only_fields = ['alumno', 'fecha_postulacion', 'estado']
