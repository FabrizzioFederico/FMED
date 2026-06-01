from django.utils import timezone
from rest_framework import serializers
from .models import Acta, Calificacion, Asistencia


class CalificacionSerializer(serializers.ModelSerializer):
    alumno_username = serializers.CharField(source='alumno.username', read_only=True)
    nombre_alumno = serializers.SerializerMethodField()
    materia = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = [
            'id', 'acta', 'alumno', 'alumno_username', 'nombre_alumno',
            'nota', 'observaciones', 'materia',
        ]

    def get_nombre_alumno(self, obj):
        nombre = f"{obj.alumno.first_name} {obj.alumno.last_name}".strip()
        return nombre or obj.alumno.username

    def get_materia(self, obj):
        if obj.acta.mesa:
            return obj.acta.mesa.materia.nombre
        if obj.acta.comision:
            return obj.acta.comision.materia.nombre
        return None


class ActaSerializer(serializers.ModelSerializer):
    calificaciones = CalificacionSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Acta
        fields = [
            'id', 'tipo', 'tipo_display', 'profesor', 'comision', 'mesa',
            'fecha_creacion', 'fecha_cierre', 'estado', 'estado_display',
            'firma_digital', 'calificaciones',
        ]
        read_only_fields = ['profesor', 'fecha_creacion', 'fecha_cierre',
                            'estado', 'firma_digital']


class AsistenciaSerializer(serializers.ModelSerializer):
    alumno_username = serializers.CharField(source='alumno.username', read_only=True)
    materia = serializers.CharField(source='comision.materia.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Asistencia
        fields = [
            'id', 'comision', 'alumno', 'alumno_username', 'materia',
            'profesor', 'fecha_clase', 'fecha_registro',
            'estado', 'estado_display',
        ]
        read_only_fields = ['profesor', 'fecha_registro']

    def validate_fecha_clase(self, value):
        """La asistencia solo puede registrarse para el día de hoy.
        Evita cargar fechas pasadas o futuras erróneas."""
        hoy = timezone.localdate()
        if value != hoy:
            raise serializers.ValidationError(
                f'La asistencia solo puede registrarse para la fecha de hoy '
                f'({hoy.strftime("%d/%m/%Y")}).'
            )
        return value
