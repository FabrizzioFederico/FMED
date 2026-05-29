import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { fetchDocumentosPendientes, validarDocumento } from '../../api/endpoints.js';
import { Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function DocumentosPendientes() {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docRechazo, setDocRechazo] = useState(null);
  const [motivo, setMotivo] = useState('');

  function cargar() {
    setLoading(true);
    fetchDocumentosPendientes().then(setItems).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function aprobar(id) {
    try {
      await validarDocumento(id, true);
      snackbar.show('Documento aprobado.', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  async function confirmarRechazo(e) {
    e.preventDefault();
    try {
      await validarDocumento(docRechazo.id, false, motivo);
      snackbar.show('Documento rechazado. Alumno queda con deuda documental.', 'success');
      setDocRechazo(null);
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
          📄 Documentos Pendientes de Validación
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Verificá la documentación subida por los alumnos. Si rechazás un
          documento, el alumno no podrá inscribirse hasta regularizarlo.
        </Typography>

        <Tabla
          vacio="No hay documentos pendientes 🎉"
          columnas={[
            { key: 'alumno_username', label: 'Alumno' },
            { key: 'tipo_display', label: 'Tipo' },
            { key: 'fecha_subida', label: 'Subido',
              render: (d) => new Date(d.fecha_subida).toLocaleDateString() },
            { key: 'archivo', label: 'Archivo',
              render: (d) => d.archivo_url
                ? <Link href={d.archivo_url} target="_blank" rel="noreferrer">Ver</Link>
                : '-' },
            { key: 'acciones', label: 'Acciones', align: 'right',
              render: (d) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="contained" color="success"
                    startIcon={<CheckCircleIcon />} onClick={() => aprobar(d.id)}>
                    Aprobar
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    startIcon={<CancelIcon />} onClick={() => setDocRechazo(d)}>
                    Rechazar
                  </Button>
                </Stack>
              ) },
          ]}
          datos={items}
        />
      </CardContent>

      <Dialog open={!!docRechazo} onClose={() => setDocRechazo(null)}
              maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar documento</DialogTitle>
        <Box component="form" onSubmit={confirmarRechazo}>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Documento de <strong>{docRechazo?.alumno_username}</strong>{' '}
              — {docRechazo?.tipo_display}
            </Typography>
            <TextField label="Motivo del rechazo" multiline rows={3} required
              fullWidth value={motivo}
              onChange={(e) => setMotivo(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocRechazo(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="error">
              Confirmar rechazo
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
}
