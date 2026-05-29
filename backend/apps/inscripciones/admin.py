from django.contrib import admin
from .models import InscripcionCursada, InscripcionFinal


@admin.register(InscripcionCursada)
class InscripcionCursadaAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'comision', 'fecha_inscripcion', 'estado')
    list_filter = ('estado', 'comision__periodo')
    search_fields = ('alumno__username', 'comision__materia__codigo')


@admin.register(InscripcionFinal)
class InscripcionFinalAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'mesa', 'fecha_inscripcion', 'estado', 'codigo_comprobante')
    list_filter = ('estado',)
    search_fields = ('alumno__username', 'codigo_comprobante')
    readonly_fields = ('codigo_comprobante',)
