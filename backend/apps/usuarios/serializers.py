"""
Serializers para autenticación y datos de usuario.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, LegajoAlumno


class UsuarioSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nombre_completo', 'rol', 'rol_display', 'dni', 'telefono',
        ]
        read_only_fields = ['id', 'rol']

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre or obj.username


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login con DNI + contraseña.

    SimpleJWT internamente autentica con el campo username, así que
    recibimos el DNI, buscamos el usuario y traducimos a su username
    antes de delegar en la validación estándar.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Reemplazamos el campo 'username' por 'dni' en el formulario
        self.fields['dni'] = serializers.CharField(write_only=True)
        self.fields.pop('username', None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['rol'] = user.rol
        token['username'] = user.username
        return token

    def validate(self, attrs):
        dni = attrs.pop('dni', None)
        if not dni:
            raise serializers.ValidationError('Debés ingresar tu DNI.')

        try:
            usuario = Usuario.objects.get(dni=dni)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError(
                'No existe un usuario con ese DNI.'
            )
        except Usuario.MultipleObjectsReturned:
            raise serializers.ValidationError(
                'Hay más de un usuario con ese DNI. Contactá a la administración.'
            )

        # SimpleJWT espera el username en attrs para validar
        attrs[self.username_field] = usuario.get_username()
        data = super().validate(attrs)
        data['user'] = UsuarioSerializer(self.user).data
        return data


class LegajoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegajoAlumno
        fields = ['numero_legajo', 'fecha_ingreso', 'deuda_documental']


class UsuarioCrearSerializer(serializers.ModelSerializer):
    """Serializer para que el administrativo cree y edite usuarios
    (alumnos, profesores y otros administrativos).

    Validaciones:
    - nombre y apellido: solo letras y espacios (sin números).
    - DNI: exactamente 8 dígitos numéricos, único.
    - teléfono: exactamente 11 dígitos numéricos, obligatorio.
    - email: obligatorio y con formato válido.
    - El password se recibe al crear pero nunca se devuelve.
    """
    password = serializers.CharField(write_only=True, min_length=6, required=False)
    rol = serializers.ChoiceField(choices=[
        ('ALUMNO', 'Alumno'),
        ('PROFESOR', 'Profesor'),
        ('ADMINISTRATIVO', 'Administrativo'),
    ])
    # El DNI es obligatorio porque es la credencial de login.
    dni = serializers.CharField(required=True)
    telefono = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    nombre_completo = serializers.SerializerMethodField(read_only=True)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'password', 'email',
            'first_name', 'last_name', 'nombre_completo',
            'rol', 'rol_display', 'dni', 'telefono',
        ]

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre or obj.username

    # ----- Validaciones campo por campo -----

    def validate_username(self, value):
        qs = Usuario.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un usuario con ese nombre de usuario.')
        return value

    def _solo_letras(self, value, campo):
        """El nombre/apellido no puede contener números ni símbolos."""
        limpio = value.strip()
        if not limpio:
            raise serializers.ValidationError(f'El {campo} no puede estar vacío.')
        # Permite letras (incluye acentos y ñ), espacios, apóstrofo y guion.
        for caracter in limpio:
            if not (caracter.isalpha() or caracter in " '-"):
                raise serializers.ValidationError(
                    f'El {campo} solo puede contener letras (sin números ni símbolos).'
                )
        return limpio

    def validate_first_name(self, value):
        return self._solo_letras(value, 'nombre')

    def validate_last_name(self, value):
        return self._solo_letras(value, 'apellido')

    def validate_dni(self, value):
        """DNI: exactamente 8 dígitos numéricos, sin letras, único."""
        limpio = value.strip()
        if not limpio.isdigit():
            raise serializers.ValidationError('El DNI solo puede contener números.')
        if len(limpio) != 8:
            raise serializers.ValidationError('El DNI debe tener exactamente 8 dígitos.')
        qs = Usuario.objects.filter(dni=limpio)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un usuario con ese DNI.')
        return limpio

    def validate_telefono(self, value):
        """Teléfono: obligatorio, exactamente 11 dígitos numéricos."""
        limpio = value.strip()
        if not limpio.isdigit():
            raise serializers.ValidationError('El teléfono solo puede contener números.')
        if len(limpio) != 11:
            raise serializers.ValidationError(
                'El teléfono debe tener exactamente 11 dígitos (ej: 1122334455).'
            )
        return limpio

    def validate(self, attrs):
        """Validaciones que dependen de varios campos."""
        # Al crear, el password es obligatorio. Al editar es opcional.
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError(
                {'password': 'La contraseña es obligatoria al crear un usuario.'}
            )
        return attrs

    # ----- Alta y modificación -----

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(password)  # hashea la contraseña
        usuario.save()

        # Si es alumno, le creamos un legajo con número correlativo
        if usuario.rol == Usuario.Rol.ALUMNO:
            ultimo = LegajoAlumno.objects.count() + 1
            LegajoAlumno.objects.create(
                usuario=usuario,
                numero_legajo=f'A-{ultimo:04d}',
            )
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
