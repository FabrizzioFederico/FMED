import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import {
  crearTramite, fetchMisTramites, descargarCertificado,
} from '../../api/endpoints.js';
import { Badge, Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

const TIPOS = [
  { value: 'CERT_REGULAR', label: 'Certificado de alumno regular' },
  { value: 'CERT_MATERIAS', label: 'Certificado de materias aprobadas' },
  { value: 'ANALITICO', label: 'Analítico parcial' },
  { value: 'TITULO', label: 'Solicitud de título' },
  { value: 'OTRO', label: 'Otro' },
];

export default function Tramites() {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('CERT_REGULAR');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(null);

  function cargar() {
    fetchMisTramites().then(setItems).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await crearTramite({ tipo, descripcion });
      snackbar.show('Trámite solicitado correctamente.', 'success');
      setDescripcion('');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function descargar(tramiteId) {
    setDescargando(tramiteId);
    try {
      const blob = await descargarCertificado(tramiteId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado_tramite_${tramiteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      snackbar.show('No se pudo descargar el certificado.', 'error');
    } finally {
      setDescargando(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📋 Solicitar Trámite
          </Typography>
          <Box component="form" onSubmit={enviar}>
            <Stack spacing={2}>
              <TextField select label="Tipo de trámite"
                value={tipo} onChange={(e) => setTipo(e.target.value)} fullWidth>
                {TIPOS.map((t) =>
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                )}
              </TextField>
              <TextField label="Descripción (opcional)" multiline rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales..."
                fullWidth />
              <Button type="submit" variant="contained" disabled={enviando}
                      sx={{ alignSelf: 'flex-start' }}>
                {enviando ? 'Enviando...' : 'Solicitar Trámite'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📜 Mis Trámites
          </Typography>
          {loading ? <Cargando /> : (
            <Tabla
              vacio="No solicitaste trámites todavía."
              columnas={[
                { key: 'tipo_display', label: 'Tipo' },
                { key: 'estado', label: 'Estado',
                  render: (t) => <Badge estado={t.estado} texto={t.estado_display} /> },
                { key: 'fecha_solicitud', label: 'Fecha',
                  render: (t) => new Date(t.fecha_solicitud).toLocaleDateString() },
                { key: 'motivo_rechazo', label: 'Motivo rechazo',
                  render: (t) => t.motivo_rechazo || '-' },
                { key: 'certificado', label: 'Certificado',
                  render: (t) =>
                    t.estado === 'APROBADO' ? (
                      <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />}
                        onClick={() => descargar(t.id)}
                        disabled={descargando === t.id}>
                        {descargando === t.id ? 'Generando...' : 'PDF'}
                      </Button>
                    ) : <span style={{ color: '#94a3b8' }}>No disponible</span>
                },
              ]}
              datos={items}
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
