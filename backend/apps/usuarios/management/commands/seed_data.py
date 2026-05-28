"""
Comando para cargar datos de prueba.

Uso:
    python manage.py seed_data

Crea:
- Usuario admin (admin/admin123) y usuarios de prueba
- Plan de estudios, materias y correlativas
- Período lectivo, aulas y comisiones
- Mesas de examen
- Una institución y una oferta de la bolsa de trabajo
"""
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.academico.models import (
    Aula, Comision, Correlativa, Materia, MesaExamen,
    PeriodoLectivo, PlanEstudio,
)
from apps.bolsa.models import Institucion, Oferta
from apps.inscripciones.models import InscripcionCursada
from apps.usuarios.models import LegajoAlumno, Usuario


class Command(BaseCommand):
    help = 'Carga datos de prueba en la base de datos.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('=== Cargando datos de prueba ==='))

        # ---------------- Usuarios ----------------
        admin, creado = Usuario.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@medicina.local',
                'first_name': 'Admin',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True,
                'rol': Usuario.Rol.ADMINISTRATIVO,
                'dni': '10000000',
            },
        )
        if creado:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('  ✓ admin (DNI 10000000) / admin123'))

        profesor1, creado = Usuario.objects.get_or_create(
            username='profesor1',
            defaults={
                'email': 'profesor1@medicina.local',
                'first_name': 'María',
                'last_name': 'García',
                'rol': Usuario.Rol.PROFESOR,
                'dni': '20111222',
            },
        )
        if creado:
            profesor1.set_password('profesor123')
            profesor1.save()
            self.stdout.write(self.style.SUCCESS('  ✓ profesor1 / profesor123'))

        profesor2, creado = Usuario.objects.get_or_create(
            username='profesor2',
            defaults={
                'email': 'profesor2@medicina.local',
                'first_name': 'Carlos',
                'last_name': 'López',
                'rol': Usuario.Rol.PROFESOR,
                'dni': '20333444',
            },
        )
        if creado:
            profesor2.set_password('profesor123')
            profesor2.save()
            self.stdout.write(self.style.SUCCESS('  ✓ profesor2 / profesor123'))

        alumno1, creado = Usuario.objects.get_or_create(
            username='alumno1',
            defaults={
                'email': 'alumno1@medicina.local',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'rol': Usuario.Rol.ALUMNO,
                'dni': '40555666',
            },
        )
        if creado:
            alumno1.set_password('alumno123')
            alumno1.save()
            LegajoAlumno.objects.get_or_create(
                usuario=alumno1,
                defaults={'numero_legajo': 'A-001'},
            )
            self.stdout.write(self.style.SUCCESS('  ✓ alumno1 / alumno123'))

        alumno2, creado = Usuario.objects.get_or_create(
            username='alumno2',
            defaults={
                'email': 'alumno2@medicina.local',
                'first_name': 'Ana',
                'last_name': 'Martínez',
                'rol': Usuario.Rol.ALUMNO,
                'dni': '40777888',
            },
        )
        if creado:
            alumno2.set_password('alumno123')
            alumno2.save()
            LegajoAlumno.objects.get_or_create(
                usuario=alumno2,
                defaults={'numero_legajo': 'A-002'},
            )
            self.stdout.write(self.style.SUCCESS('  ✓ alumno2 / alumno123'))

        # ---------------- Plan + Materias ----------------
        plan, _ = PlanEstudio.objects.get_or_create(
            nombre='Plan 2020 - Medicina',
            defaults={'anio_vigencia': 2020, 'activo': True},
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Plan: {plan}'))

        materias_data = [
            ('MED101', 'Anatomía I', 1, Materia.Regimen.ANUAL, 240),
            ('MED102', 'Biología Celular', 1, Materia.Regimen.CUATRIMESTRAL, 80),
            ('MED103', 'Química Biológica', 1, Materia.Regimen.CUATRIMESTRAL, 80),
            ('MED201', 'Anatomía II', 2, Materia.Regimen.ANUAL, 240),
            ('MED202', 'Fisiología', 2, Materia.Regimen.ANUAL, 240),
            ('MED301', 'Patología', 3, Materia.Regimen.ANUAL, 240),
            ('MED302', 'Farmacología', 3, Materia.Regimen.CUATRIMESTRAL, 120),
        ]
        materias = {}
        for codigo, nombre, anio, regimen, ch in materias_data:
            materia, _ = Materia.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'plan': plan, 'nombre': nombre,
                    'anio': anio, 'regimen': regimen,
                    'carga_horaria': ch,
                },
            )
            materias[codigo] = materia
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(materias)} materias'))

        # Correlativas (Anatomía II requiere Anatomía I aprobada, etc.)
        correlativas = [
            ('MED201', 'MED101', Correlativa.Tipo.FINAL),    # Anat II ← Anat I aprobada
            ('MED202', 'MED103', Correlativa.Tipo.FINAL),    # Fisio ← Quím aprobada
            ('MED301', 'MED201', Correlativa.Tipo.FINAL),    # Pato ← Anat II aprobada
            ('MED301', 'MED202', Correlativa.Tipo.FINAL),    # Pato ← Fisio aprobada
            ('MED302', 'MED202', Correlativa.Tipo.CURSADA),  # Farma ← Fisio regular
        ]
        for codigo_materia, codigo_requiere, tipo in correlativas:
            Correlativa.objects.get_or_create(
                materia=materias[codigo_materia],
                requiere=materias[codigo_requiere],
                tipo=tipo,
            )
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(correlativas)} correlativas'))

        # ---------------- Período lectivo + Aulas ----------------
        hoy = date.today()
        periodo, _ = PeriodoLectivo.objects.get_or_create(
            nombre='1er Cuatrimestre 2026',
            defaults={
                'fecha_inicio': date(hoy.year, 3, 1),
                'fecha_fin': date(hoy.year, 7, 15),
                'inscripciones_abiertas': True,
            },
        )
        self.stdout.write(self.style.SUCCESS(f'  ✓ Período: {periodo}'))

        aula_a, _ = Aula.objects.get_or_create(nombre='Aula 101', defaults={'capacidad': 40})
        aula_b, _ = Aula.objects.get_or_create(nombre='Aula 202', defaults={'capacidad': 30})

        # ---------------- Comisiones ----------------
        com1, creado = Comision.objects.get_or_create(
            materia=materias['MED101'], periodo=periodo, nombre='Comisión A',
            defaults={'aula': aula_a, 'horario': 'Lun y Mie 18-22', 'cupo': 40},
        )
        if creado:
            com1.profesores.add(profesor1)

        com2, creado = Comision.objects.get_or_create(
            materia=materias['MED102'], periodo=periodo, nombre='Comisión Única',
            defaults={'aula': aula_b, 'horario': 'Mar y Jue 18-22', 'cupo': 30},
        )
        if creado:
            com2.profesores.add(profesor2)

        com3, creado = Comision.objects.get_or_create(
            materia=materias['MED201'], periodo=periodo, nombre='Comisión A',
            defaults={'aula': aula_a, 'horario': 'Vie 16-22', 'cupo': 35},
        )
        if creado:
            com3.profesores.add(profesor1)

        self.stdout.write(self.style.SUCCESS('  ✓ 3 comisiones'))

        # ---------------- Inscripciones de prueba ----------------
        # alumno1 regular en Anatomía I y Biología Celular → puede rendir final
        InscripcionCursada.objects.get_or_create(
            alumno=alumno1, comision=com1,
            defaults={'estado': InscripcionCursada.Estado.REGULAR},
        )
        InscripcionCursada.objects.get_or_create(
            alumno=alumno1, comision=com2,
            defaults={'estado': InscripcionCursada.Estado.REGULAR},
        )
        # alumno2 solo regular en Biología Celular
        InscripcionCursada.objects.get_or_create(
            alumno=alumno2, comision=com2,
            defaults={'estado': InscripcionCursada.Estado.REGULAR},
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Inscripciones de cursada de prueba'))

        # ---------------- Mesas de examen ----------------
        mesa1, creado = MesaExamen.objects.get_or_create(
            materia=materias['MED101'],
            fecha=timezone.now() + timedelta(days=15),
            defaults={'cupo': 50},
        )
        if creado:
            mesa1.profesores.add(profesor1)

        mesa2, creado = MesaExamen.objects.get_or_create(
            materia=materias['MED102'],
            fecha=timezone.now() + timedelta(days=20),
            defaults={'cupo': 30},
        )
        if creado:
            mesa2.profesores.add(profesor2)

        self.stdout.write(self.style.SUCCESS('  ✓ 2 mesas de examen futuras'))

        # ---------------- Bolsa de trabajo ----------------
        inst, _ = Institucion.objects.get_or_create(
            nombre='Hospital Central',
            defaults={
                'cuit': '30-12345678-9',
                'email_contacto': 'rrhh@hospitalcentral.local',
                'telefono': '011-4444-5555',
                'direccion': 'Av. Siempreviva 1234',
            },
        )

        Oferta.objects.get_or_create(
            institucion=inst,
            titulo='Residencia en Medicina Interna 2026',
            defaults={
                'descripcion': 'Programa de residencia de 4 años con rotaciones.',
                'tipo': Oferta.Tipo.RESIDENCIA,
                'requisitos': 'Egresado en el último año o recién recibido.',
                'fecha_cierre': date.today() + timedelta(days=60),
            },
        )
        self.stdout.write(self.style.SUCCESS('  ✓ Institución y oferta de ejemplo'))

        self.stdout.write(self.style.SUCCESS('\n=== Datos de prueba cargados ✓ ==='))
        self.stdout.write('El login se hace con DNI + contraseña:')
        self.stdout.write('  Admin     → DNI 10000000 / admin123')
        self.stdout.write('  Profesor  → DNI 20111222 / profesor123')
        self.stdout.write('  Alumno 1  → DNI 40555666 / alumno123  (regular en MED101 y MED102)')
        self.stdout.write('  Alumno 2  → DNI 40777888 / alumno123  (regular solo en MED102)')
