import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export function Cargando() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export function Vacio({ children }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
        {children}
      </Typography>
    </Box>
  );
}

export function Badge({ estado, texto }) {
  const map = {
    APROBADO: 'success', REGULAR: 'success', ABIERTA: 'success',
    PRESENTE: 'success', ACEPTADO: 'success',
    INSCRIPTO: 'info', JUSTIFICADO: 'info',
    PENDIENTE: 'warning', EN_REVISION: 'warning', PROVISORIA: 'warning',
    POSTULADO: 'warning',
    RECHAZADO: 'error', CERRADA: 'error', AUSENTE: 'error',
    LIBRE: 'error', BAJA: 'error', DESAPROBADO: 'error',
    ALUMNO: 'info', PROFESOR: 'success', ADMINISTRATIVO: 'warning',
  };
  return (
    <Chip
      label={texto || estado}
      color={map[estado] || 'default'}
      size="small"
      variant={map[estado] ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
}

export function mensajeError(err, fallback = 'Ocurrió un error.') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const primero = Object.values(data)[0];
  if (Array.isArray(primero)) return primero[0];
  if (typeof primero === 'string') return primero;
  return fallback;
}
