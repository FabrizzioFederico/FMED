from django.contrib import admin
from .models import Acta, Calificacion, Asistencia


class CalificacionInline(admin.TabularInline):
    model = Calificacion
    extra = 0


@admin.register(Acta)
class ActaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'profesor', 'estado', 'fecha_creacion', 'fecha_cierre')
    list_filter = ('estado', 'tipo')
    inlines = [CalificacionInline]
    readonly_fields = ('firma_digital', 'fecha_creacion', 'fecha_cierre')


@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'acta', 'nota')
    list_filter = ('acta__tipo',)
    search_fields = ('alumno__username',)


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'comision', 'fecha_clase', 'estado', 'fecha_registro')
    list_filter = ('estado', 'fecha_clase')
    readonly_fields = ('fecha_registro',)
