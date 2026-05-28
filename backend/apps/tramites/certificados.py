"""
Generación de certificados en PDF con ReportLab.

Cuando un trámite es aprobado por el administrativo, el alumno puede
descargar el certificado correspondiente como PDF. El diseño imita una
constancia institucional formal: encabezado, cuerpo, firmas y un código
de verificación único.
"""
import io
from datetime import date

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas


MESES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]


def _fecha_larga(d: date) -> str:
    """Devuelve la fecha en formato: '17 días del mes de Mayo del año 2026'."""
    return f"{d.day} días del mes de {MESES[d.month]} del año {d.year}"


# Texto del cuerpo según el tipo de trámite. {nombre}, {dni} y {extra}
# se reemplazan al generar el PDF.
CUERPOS = {
    'CERT_REGULAR': (
        "Por la presente se deja constancia que el/la alumno/a "
        "{nombre}, con DNI N° {dni}, reviste la condición de "
        "ALUMNO/A REGULAR en esta Facultad de Medicina, encontrándose "
        "habilitado/a para continuar con sus estudios."
    ),
    'CERT_MATERIAS': (
        "Por la presente se deja constancia que el/la alumno/a "
        "{nombre}, con DNI N° {dni}, ha aprobado las materias "
        "correspondientes a su plan de estudios en esta Facultad de Medicina, "
        "según los registros académicos vigentes."
    ),
    'ANALITICO': (
        "Por la presente se extiende ANALÍTICO PARCIAL del/la alumno/a "
        "{nombre}, con DNI N° {dni}, detallando las asignaturas cursadas "
        "y aprobadas en esta Facultad de Medicina."
    ),
    'TITULO': (
        "Por la presente se deja constancia que el/la alumno/a "
        "{nombre}, con DNI N° {dni}, ha iniciado el trámite de "
        "solicitud de TÍTULO en esta Facultad de Medicina, habiendo "
        "cumplimentado los requisitos académicos correspondientes."
    ),
    'OTRO': (
        "Por la presente se deja constancia que el/la alumno/a "
        "{nombre}, con DNI N° {dni}, ha realizado una solicitud "
        "ante esta Facultad de Medicina, la cual ha sido aprobada por "
        "el área administrativa."
    ),
}


def generar_certificado_pdf(tramite) -> bytes:
    """Genera el PDF del certificado de un trámite aprobado.

    Recibe un objeto Tramite y devuelve los bytes del PDF, listos para
    enviar como respuesta HTTP descargable.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    ancho, alto = A4

    azul = HexColor('#1e3a8a')
    gris = HexColor('#475569')

    alumno = tramite.alumno
    nombre = f"{alumno.first_name} {alumno.last_name}".strip() or alumno.username
    dni = alumno.dni or '---'

    # ----------------- Encabezado -----------------
    c.setFillColor(azul)
    c.setFont('Helvetica-Bold', 18)
    c.drawCentredString(ancho / 2, alto - 3 * cm, 'FACULTAD DE MEDICINA')

    c.setFont('Helvetica', 11)
    c.setFillColor(gris)
    c.drawCentredString(ancho / 2, alto - 3.7 * cm, 'Intranet Académica - Sistema de Gestión')

    # Línea separadora
    c.setStrokeColor(azul)
    c.setLineWidth(2)
    c.line(3 * cm, alto - 4.3 * cm, ancho - 3 * cm, alto - 4.3 * cm)

    # ----------------- Título del certificado -----------------
    c.setFillColor(azul)
    c.setFont('Helvetica-Bold', 14)
    titulo = tramite.get_tipo_display().upper()
    c.drawCentredString(ancho / 2, alto - 6 * cm, titulo)

    # ----------------- Cuerpo -----------------
    cuerpo = CUERPOS.get(tramite.tipo, CUERPOS['OTRO']).format(
        nombre=nombre, dni=dni,
    )

    c.setFillColor(HexColor('#1a202c'))
    c.setFont('Helvetica', 12)
    _dibujar_parrafo(c, cuerpo, 3 * cm, alto - 8 * cm,
                     ancho - 6 * cm, interlineado=0.75 * cm)

    # Párrafo de fecha
    fecha_txt = (
        f"Se extiende el presente certificado a pedido del/la interesado/a "
        f"a los {_fecha_larga(date.today())}, para ser presentado ante "
        f"las autoridades que correspondan."
    )
    _dibujar_parrafo(c, fecha_txt, 3 * cm, alto - 11.5 * cm,
                     ancho - 6 * cm, interlineado=0.75 * cm)

    # ----------------- Firmas -----------------
    y_firma = 7 * cm
    c.setStrokeColor(gris)
    c.setLineWidth(1)
    # Línea izquierda
    c.line(4 * cm, y_firma, 9 * cm, y_firma)
    c.setFont('Helvetica', 10)
    c.setFillColor(gris)
    c.drawCentredString(6.5 * cm, y_firma - 0.6 * cm, 'Secretaría Académica')
    # Línea derecha
    c.line(ancho - 9 * cm, y_firma, ancho - 4 * cm, y_firma)
    c.drawCentredString(ancho - 6.5 * cm, y_firma - 0.6 * cm, 'Decanato')

    # ----------------- Código de verificación -----------------
    codigo = tramite.codigo_qr_verificacion or '(sin código)'
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(azul)
    c.drawCentredString(ancho / 2, 4 * cm, 'CÓDIGO DE VERIFICACIÓN')
    c.setFont('Courier', 10)
    c.setFillColor(HexColor('#1a202c'))
    c.drawCentredString(ancho / 2, 3.5 * cm, codigo)

    # ----------------- Nota al pie -----------------
    c.setFont('Helvetica-Oblique', 8)
    c.setFillColor(gris)
    c.drawCentredString(
        ancho / 2, 2 * cm,
        'Documento generado digitalmente. Verificable con el código indicado.'
    )
    c.drawCentredString(
        ancho / 2, 1.6 * cm,
        f'Trámite N° {tramite.id} - Emitido el {date.today().strftime("%d/%m/%Y")}'
    )

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def _dibujar_parrafo(c, texto, x, y, ancho_max, interlineado):
    """Dibuja un texto largo cortándolo en varias líneas (word wrap).

    ReportLab por sí solo no hace salto de línea automático, así que
    vamos midiendo el ancho de cada palabra y cortamos cuando se pasa.
    """
    palabras = texto.split()
    linea = ''
    y_actual = y
    for palabra in palabras:
        prueba = (linea + ' ' + palabra).strip()
        # stringWidth mide el ancho del texto con la fuente actual
        ancho_actual = c.stringWidth(prueba, c._fontname, c._fontsize)
        if ancho_actual <= ancho_max:
            linea = prueba
        else:
            c.drawString(x, y_actual, linea)
            y_actual -= interlineado
            linea = palabra
    if linea:
        c.drawString(x, y_actual, linea)
    return y_actual
