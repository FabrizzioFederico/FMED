from rest_framework import serializers
from .models import InscripcionCursada, InscripcionFinal


class InscripcionCursadaSerializer(serializers.ModelSerializer):
    materia = serializers.CharField(source='comision.materia.nombre', read_only=True)
    comision_nombre = serializers.CharField(source='comision.nombre', read_only=True)
    horario = serializers.CharField(source='comision.horario', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = InscripcionCursada
        fields = [
            'id', 'alumno', 'comision', 'comision_nombre', 'materia',
            'horario', 'fecha_inscripcion', 'estado', 'estado_display',
        ]
        read_only_fields = ['alumno', 'fecha_inscripcion', 'estado']


class InscripcionFinalSerializer(serializers.ModelSerializer):
    materia = serializers.CharField(source='mesa.materia.nombre', read_only=True)
    codigo_materia = serializers.CharField(source='mesa.materia.codigo', read_only=True)
    fecha_mesa = serializers.DateTimeField(source='mesa.fecha', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = InscripcionFinal
        fields = [
            'id', 'alumno', 'mesa', 'materia', 'codigo_materia', 'fecha_mesa',
            'fecha_inscripcion', 'estado', 'estado_display', 'codigo_comprobante',
        ]
        read_only_fields = ['alumno', 'fecha_inscripcion', 'estado', 'codigo_comprobante']
