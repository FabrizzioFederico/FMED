from rest_framework import serializers
from .models import Tramite, Documento


class DocumentoSerializer(serializers.ModelSerializer):
    alumno_username = serializers.CharField(source='alumno.username', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    # archivo_url: URL completa (con http://localhost:8000) lista para abrir.
    archivo_url = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'alumno', 'alumno_username', 'tipo', 'tipo_display',
            'archivo', 'archivo_url', 'estado', 'estado_display',
            'fecha_subida', 'fecha_revision', 'revisado_por',
            'motivo_rechazo',
        ]
        read_only_fields = ['alumno', 'estado', 'fecha_subida',
                            'fecha_revision', 'revisado_por', 'motivo_rechazo']

    def get_archivo_url(self, obj):
        """Devuelve la URL absoluta del archivo (ej: http://localhost:8000/media/...).
        Sin esto, el FileField devuelve una ruta relativa que el frontend
        interpreta mal y redirige al inicio."""
        if not obj.archivo:
            return None
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(obj.archivo.url)
        return obj.archivo.url


class TramiteSerializer(serializers.ModelSerializer):
    alumno_username = serializers.CharField(source='alumno.username', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Tramite
        fields = [
            'id', 'alumno', 'alumno_username', 'tipo', 'tipo_display',
            'estado', 'estado_display', 'descripcion',
            'fecha_solicitud', 'fecha_resolucion',
            'administrativo', 'motivo_rechazo', 'codigo_qr_verificacion',
        ]
        read_only_fields = ['alumno', 'estado', 'fecha_solicitud',
                            'fecha_resolucion', 'administrativo',
                            'motivo_rechazo', 'codigo_qr_verificacion']
