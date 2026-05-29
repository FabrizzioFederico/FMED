import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { fetchDocumentos, subirDocumento } from '../../api/endpoints.js';
import { Badge, Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

const TIPOS = [
  { value: 'DNI', label: 'DNI' },
  { value: 'TITULO_SEC', label: 'Título Secundario' },
  { value: 'CERT_MED', label: 'Certificado médico' },
  { value: 'OTRO', label: 'Otro' },
];

export default function MisDocumentos() {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('DNI');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef();

  function cargar() {
    fetchDocumentos().then(setItems).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    if (!archivo) {
      snackbar.show('Seleccioná un archivo.', 'warning');
      return;
    }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('tipo', tipo);
      fd.append('archivo', archivo);
      await subirDocumento(fd);
      snackbar.show('Documento subido. Queda pendiente de validación.', 'success');
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📤 Subir Documento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Subí tu documentación para que el área administrativa la valide.
            Si un documento es rechazado, no podrás inscribirte hasta regularizarlo.
          </Typography>
          <Box component="form" onSubmit={enviar}>
            <Stack spacing={2}>
              <TextField select label="Tipo de documento" value={tipo}
                onChange={(e) => setTipo(e.target.value)} fullWidth>
                {TIPOS.map((t) =>
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                )}
              </TextField>
              <Button variant="outlined" component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ alignSelf: 'flex-start' }}>
                {archivo ? archivo.name : 'Elegir archivo (PDF/imagen)'}
                <input ref={inputRef} type="file" hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setArchivo(e.target.files[0])} />
              </Button>
              <Button type="submit" variant="contained" disabled={enviando}
                      sx={{ alignSelf: 'flex-start' }}>
                {enviando ? 'Subiendo...' : 'Subir Documento'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📁 Mis Documentos
          </Typography>
          {loading ? <Cargando /> : (
            <Tabla
              vacio="No subiste documentos todavía."
              columnas={[
                { key: 'tipo_display', label: 'Tipo' },
                { key: 'estado', label: 'Estado',
                  render: (d) => <Badge estado={d.estado} texto={d.estado_display} /> },
                { key: 'fecha_subida', label: 'Subido',
                  render: (d) => new Date(d.fecha_subida).toLocaleDateString() },
                { key: 'motivo_rechazo', label: 'Motivo rechazo',
                  render: (d) => d.motivo_rechazo || '-' },
                { key: 'archivo_url', label: 'Archivo',
                  render: (d) => d.archivo_url
                    ? <Link href={d.archivo_url} target="_blank" rel="noreferrer">Ver</Link>
                    : '-' },
              ]}
              datos={items}
            />
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
