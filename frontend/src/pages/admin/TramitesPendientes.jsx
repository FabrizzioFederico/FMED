import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { fetchTramitesPendientes, resolverTramite } from '../../api/endpoints.js';
import { Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function TramitesPendientes() {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tramiteRechazo, setTramiteRechazo] = useState(null);
  const [motivo, setMotivo] = useState('');

  function cargar() {
    setLoading(true);
    fetchTramitesPendientes().then(setItems).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function aprobar(id) {
    try {
      await resolverTramite(id, true);
      snackbar.show('Trámite aprobado.', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  async function confirmarRechazo(e) {
    e.preventDefault();
    try {
      await resolverTramite(tramiteRechazo.id, false, motivo);
      snackbar.show('Trámite rechazado.', 'success');
      setTramiteRechazo(null);
      setMotivo('');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          📥 Trámites Pendientes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Validá los trámites de los alumnos. Cada acción queda registrada
          en el log de auditoría.
        </Typography>

        <Tabla
          vacio="No hay trámites pendientes 🎉"
          columnas={[
            { key: 'alumno_username', label: 'Alumno' },
            { key: 'tipo_display', label: 'Tipo' },
            { key: 'descripcion', label: 'Descripción',
              render: (t) => t.descripcion || '-' },
            { key: 'fecha_solicitud', label: 'Fecha',
              render: (t) => new Date(t.fecha_solicitud).toLocaleDateString() },
            { key: 'acciones', label: 'Acciones', align: 'right',
              render: (t) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="contained" color="success"
                    startIcon={<CheckCircleIcon />} onClick={() => aprobar(t.id)}>
                    Aprobar
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    startIcon={<CancelIcon />} onClick={() => setTramiteRechazo(t)}>
                    Rechazar
                  </Button>
                </Stack>
              ) },
          ]}
          datos={items}
        />
      </CardContent>

      <Dialog open={!!tramiteRechazo} onClose={() => setTramiteRechazo(null)}
              maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar trámite</DialogTitle>
        <Box component="form" onSubmit={confirmarRechazo}>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Trámite de <strong>{tramiteRechazo?.alumno_username}</strong>{' '}
              — {tramiteRechazo?.tipo_display}
            </Typography>
            <TextField label="Motivo del rechazo" multiline rows={3} required
              fullWidth value={motivo}
              onChange={(e) => setMotivo(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTramiteRechazo(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="error">
              Confirmar rechazo
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
}
