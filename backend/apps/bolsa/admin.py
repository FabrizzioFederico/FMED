from django.contrib import admin
from .models import Institucion, Oferta, Postulacion


@admin.register(Institucion)
class InstitucionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cuit', 'email_contacto', 'activa')
    list_filter = ('activa',)
    search_fields = ('nombre', 'cuit')


@admin.register(Oferta)
class OfertaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'institucion', 'tipo', 'estado', 'fecha_publicacion')
    list_filter = ('tipo', 'estado')
    search_fields = ('titulo', 'institucion__nombre')


@admin.register(Postulacion)
class PostulacionAdmin(admin.ModelAdmin):
    list_display = ('alumno', 'oferta', 'estado', 'fecha_postulacion')
    list_filter = ('estado',)
    search_fields = ('alumno__username', 'oferta__titulo')
