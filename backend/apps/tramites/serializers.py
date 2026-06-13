from rest_framework import serializers
from .models import Tramite, Documento

# Tamaño máximo permitido para un documento subido (en MB).
MAX_DOCUMENTO_MB = 5


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

    def validate_archivo(self, archivo):
        """Solo se aceptan archivos PDF. Validado en el BACKEND.

        Se chequea en tres niveles para que no alcance con renombrar la
        extensión de una imagen a .pdf:
          1) La extensión del nombre termina en .pdf
          2) El content_type declarado es application/pdf
          3) La firma binaria del archivo empieza con b'%PDF-'
             (todo PDF real arranca con esos bytes)
        Además se limita el tamaño máximo a MAX_DOCUMENTO_MB.
        """
        if not archivo:
            raise serializers.ValidationError('Tenés que adjuntar un archivo.')

        # 1) Extensión
        nombre = (archivo.name or '').lower()
        if not nombre.endswith('.pdf'):
            raise serializers.ValidationError(
                'El archivo debe ser un PDF (la extensión tiene que ser .pdf).'
            )

        # 2) content_type declarado por el navegador
        content_type = getattr(archivo, 'content_type', '') or ''
        if content_type and content_type != 'application/pdf':
            raise serializers.ValidationError(
                'El tipo de archivo no es un PDF válido.'
            )

        # 3) Tamaño máximo
        max_bytes = MAX_DOCUMENTO_MB * 1024 * 1024
        if archivo.size > max_bytes:
            raise serializers.ValidationError(
                f'El archivo no puede superar los {MAX_DOCUMENTO_MB} MB.'
            )

        # 4) Firma binaria real del PDF
        try:
            cabecera = archivo.read(5)
            archivo.seek(0)  # rebobinamos para que luego se guarde completo
        except Exception:
            raise serializers.ValidationError('No se pudo leer el archivo subido.')
        if cabecera[:5] != b'%PDF-':
            raise serializers.ValidationError(
                'El contenido del archivo no corresponde a un PDF.'
            )
        return archivo


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
