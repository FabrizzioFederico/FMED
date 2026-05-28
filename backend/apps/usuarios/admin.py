from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario, LegajoAlumno, LogAuditoria


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active')
    list_filter = ('rol', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Datos adicionales', {'fields': ('rol', 'dni', 'telefono', 'fecha_nacimiento')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Datos adicionales', {'fields': ('rol', 'dni')}),
    )


@admin.register(LegajoAlumno)
class LegajoAlumnoAdmin(admin.ModelAdmin):
    list_display = ('numero_legajo', 'usuario', 'fecha_ingreso', 'deuda_documental')
    search_fields = ('numero_legajo', 'usuario__username')
    list_filter = ('deuda_documental',)


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'usuario', 'accion')
    list_filter = ('accion',)
    search_fields = ('usuario__username', 'detalle')
    readonly_fields = ('usuario', 'accion', 'detalle', 'fecha')
