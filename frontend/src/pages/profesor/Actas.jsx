import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';

import {
  cargarNota, cerrarActa, crearActa, fetchActas,
  fetchAlumnos, fetchMesasExamen,
} from '../../api/endpoints.js';
import { Badge, Cargando, Vacio, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function Actas() {
  const snackbar = useSnackbar();
  const [actas, setActas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalCrear, setModalCrear] = useState(false);
  const [tipoActa, setTipoActa] = useState('FINAL');
  const [mesaActa, setMesaActa] = useState('');

  const [actaNota, setActaNota] = useState(null);
  const [alumnoNota, setAlumnoNota] = useState('');
  const [nota, setNota] = useState('');
  const [obsNota, setObsNota] = useState('');

  function cargar() {
    Promise.all([fetchActas(), fetchAlumnos(), fetchMesasExamen()])
      .then(([a, al, m]) => { setActas(a); setAlumnos(al); setMesas(m); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function crear(e) {
    e.preventDefault();
    try {
      const datos = { tipo: tipoActa };
      if (tipoActa === 'FINAL' && mesaActa) datos.mesa = parseInt(mesaActa);
      await crearActa(datos);
      snackbar.show('Acta creada (estado provisorio).', 'success');
      setModalCrear(false);
      setMesaActa('');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  async function guardarNota(e) {
    e.preventDefault();
    try {
      await cargarNota(actaNota.id, parseInt(alumnoNota), parseFloat(nota), obsNota);
      snackbar.show('Nota cargada correctamente.', 'success');
      setActaNota(null);
      setAlumnoNota(''); setNota(''); setObsNota('');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  async function cerrar(actaId) {
    if (!confirm('¿Cerrar acta? Una vez cerrada y firmada no se podrá modificar.'))
      return;
    try {
      await cerrarActa(actaId);
      snackbar.show('Acta cerrada y firmada digitalmente.', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  if (loading) return <Cargando />;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
                 alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Typography variant="h6" color="primary">📑 Actas y Notas</Typography>
            <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => setModalCrear(true)}>
              Nueva acta
            </Button>
          </Stack>
          {actas.length === 0 && <Box sx={{ mt: 2 }}><Vacio>No hay actas creadas.</Vacio></Box>}
        </CardContent>
      </Card>

      {actas.map((acta) => (
        <Card key={acta.id}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
                   alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Acta #{acta.id} — {acta.tipo_display}
                </Typography>
                <Badge estado={acta.estado} texto={acta.estado_display} />
              </Stack>
              {acta.estado === 'PROVISORIA' && (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained"
                          onClick={() => setActaNota(acta)}>
                    + Cargar nota
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                          startIcon={<LockIcon />} onClick={() => cerrar(acta.id)}>
                    Cerrar acta
                  </Button>
                </Stack>
              )}
            </Stack>

            {acta.firma_digital && (
              <Typography variant="caption" color="text.secondary">
                🔒 Firma digital: <code>{acta.firma_digital.slice(0, 40)}…</code>
              </Typography>
            )}

            <Box sx={{ mt: 1 }}>
              <Tabla
                vacio="Sin notas cargadas."
                columnas={[
                  { key: 'alumno', label: 'Alumno',
                    render: (c) => `${c.nombre_alumno} (${c.alumno_username})` },
                  { key: 'nota', label: 'Nota',
                    render: (c) => (
                      <Box sx={{ fontWeight: 700,
                        color: parseFloat(c.nota) >= 4 ? 'success.main' : 'error.main' }}>
                        {c.nota}
                      </Box>
                    ) },
                  { key: 'observaciones', label: 'Observaciones',
                    render: (c) => c.observaciones || '-' },
                ]}
                datos={acta.calificaciones || []}
              />
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Dialog: crear acta */}
      <Dialog open={modalCrear} onClose={() => setModalCrear(false)}
              maxWidth="sm" fullWidth>
        <DialogTitle>Nueva acta</DialogTitle>
        <Box component="form" onSubmit={crear}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField select label="Tipo de acta" value={tipoActa}
                onChange={(e) => setTipoActa(e.target.value)} fullWidth>
                <MenuItem value="FINAL">Final</MenuItem>
                <MenuItem value="PARCIAL">Parcial</MenuItem>
              </TextField>
              {tipoActa === 'FINAL' && (
                <TextField select label="Mesa de examen (opcional)"
                  value={mesaActa} onChange={(e) => setMesaActa(e.target.value)}
                  fullWidth>
                  <MenuItem value="">-- Sin mesa --</MenuItem>
                  {mesas.map((m) =>
                    <MenuItem key={m.id} value={m.id}>
                      {m.materia_codigo} - {new Date(m.fecha).toLocaleDateString()}
                    </MenuItem>
                  )}
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalCrear(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Crear acta</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Dialog: cargar nota */}
      <Dialog open={!!actaNota} onClose={() => setActaNota(null)}
              maxWidth="sm" fullWidth>
        <DialogTitle>Cargar nota — Acta #{actaNota?.id}</DialogTitle>
        <Box component="form" onSubmit={guardarNota}>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField select label="Alumno" value={alumnoNota} required
                onChange={(e) => setAlumnoNota(e.target.value)} fullWidth>
                <MenuItem value="">-- Seleccionar --</MenuItem>
                {alumnos.map((a) =>
                  <MenuItem key={a.id} value={a.id}>
                    {a.nombre_completo} ({a.username})
                  </MenuItem>
                )}
              </TextField>
              <TextField label="Nota (0 a 10)" type="number" value={nota}
                onChange={(e) => setNota(e.target.value)} required fullWidth
                inputProps={{ min: 0, max: 10, step: 0.01 }} />
              <TextField label="Observaciones (opcional)" value={obsNota}
                onChange={(e) => setObsNota(e.target.value)} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActaNota(null)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar nota</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
