import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { actualizarPerfil } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../components/ui.jsx';
import { useSnackbar } from '../context/SnackbarContext.jsx';


export default function MiPerfil() {
  const { user, setUser } = useAuth();
  const snackbar = useSnackbar();

  const [email, setEmail] = useState(user?.email || '');
  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdRepetir, setPwdRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    if (pwdNueva && pwdNueva !== pwdRepetir) {
      snackbar.show('Las contraseñas nuevas no coinciden.', 'error');
      return;
    }
    const datos = {};
    if (email !== user.email) datos.email = email;
    if (pwdNueva) {
      datos.password_actual = pwdActual;
      datos.password_nueva = pwdNueva;
    }
    if (Object.keys(datos).length === 0) {
      snackbar.show('No hiciste ningún cambio.', 'info');
      return;
    }

    setGuardando(true);
    try {
      const resp = await actualizarPerfil(datos);
      snackbar.show(resp.detail, 'success');
      if (resp.user) setUser(resp.user);
      setPwdActual(''); setPwdNueva(''); setPwdRepetir('');
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            👤 Mi Perfil
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estos son tus datos. Solo podés modificar tu email y tu contraseña.
            El resto lo gestiona el área administrativa.
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
          }}>
            <TextField label="Nombre completo" value={user?.nombre_completo || ''}
                       disabled fullWidth />
            <TextField label="DNI (usuario de acceso)" value={user?.dni || ''}
                       disabled fullWidth />
            <TextField label="Rol" value={user?.rol_display || ''}
                       disabled fullWidth />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            ✏️ Modificar mis datos
          </Typography>
          <Box component="form" onSubmit={guardar}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Email</Typography>
                <TextField label="Email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth sx={{ maxWidth: 420 }} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Cambiar contraseña</Typography>
                <Typography variant="caption" color="text.secondary"
                  sx={{ display: 'block', mb: 2 }}>
                  Dejá estos campos vacíos si no querés cambiar la contraseña.
                </Typography>
                <Stack spacing={2} sx={{ maxWidth: 420 }}>
                  <TextField label="Contraseña actual" type="password"
                    value={pwdActual}
                    onChange={(e) => setPwdActual(e.target.value)} fullWidth />
                  <TextField label="Nueva contraseña" type="password"
                    value={pwdNueva} inputProps={{ minLength: 6 }}
                    onChange={(e) => setPwdNueva(e.target.value)} fullWidth />
                  <TextField label="Repetir nueva contraseña" type="password"
                    value={pwdRepetir}
                    onChange={(e) => setPwdRepetir(e.target.value)} fullWidth />
                </Stack>
              </Box>

              <Button type="submit" variant="contained" disabled={guardando}
                      sx={{ alignSelf: 'flex-start' }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
