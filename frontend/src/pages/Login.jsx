import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../components/ui.jsx';

export default function Login() {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(dni, password);
      navigate('/');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar sesión. Revisá tu DNI y contraseña.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/images/fondo.jpg)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header con logo y título */}
          <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="Logo Facultad de Medicina"
              sx={{
                height: 100,
                objectFit: 'contain'
              }}
            />
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, textAlign: 'center' }}>
              Intranet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Facultad de Medicina — Iniciá sesión
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Sin puntos, ej: 40555666"
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large"
                disabled={loading} fullWidth>
                {loading ? 'Iniciando...' : 'Entrar'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Usuarios de prueba (DNI / contraseña):
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              • 10000000 / admin123 (administrativo)<br />
              • 20111222 / profesor123<br />
              • 40555666 / alumno123<br />
              • 40777888 / alumno123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
