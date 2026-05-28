from django.contrib import admin
from .models import Tramite, Documento


@admin.register(Tramite)
class TramiteAdmin(admin.ModelAdmin):
    list_display = ('id', 'alumno', 'tipo', 'estado', 'fecha_solicitud')
    list_filter = ('estado', 'tipo')
    search_fields = ('alumno__username',)
    readonly_fields = ('codigo_qr_verificacion', 'fecha_solicitud', 'fecha_resolucion')


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'alumno', 'tipo', 'estado', 'fecha_subida')
    list_filter = ('estado', 'tipo')
    search_fields = ('alumno__username',)
    readonly_fields = ('fecha_subida', 'fecha_revision')
