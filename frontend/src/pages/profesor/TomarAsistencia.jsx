import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  fetchComisiones, fetchAlumnos, registrarAsistencia, fetchAsistencias,
} from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function TomarAsistencia() {
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [comisiones, setComisiones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comisionId, setComisionId] = useState('');
  const [estados, setEstados] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Fecha de la clase = hoy (local, no UTC)
  const fechaClase = (() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d - offset).toISOString().slice(0, 10);
  })();

  function cargar() {
    Promise.all([fetchComisiones(), fetchAlumnos(), fetchAsistencias()])
      .then(([com, alu, asis]) => {
        setComisiones(com.filter((c) => (c.profesores || []).includes(user.id)));
        setAlumnos(alu);
        setAsistencias(asis);
      })
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [user]);

  function setEstado(alumnoId, estado) {
    setEstados((e) => ({ ...e, [alumnoId]: estado }));
  }

  async function guardar() {
    if (!comisionId) {
      snackbar.show('Seleccioná una comisión.', 'warning');
      return;
    }
    const aRegistrar = Object.entries(estados);
    if (aRegistrar.length === 0) {
      snackbar.show('Marcá la asistencia de al menos un alumno.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      for (const [alumnoId, estado] of aRegistrar) {
        await registrarAsistencia({
          comision: parseInt(comisionId),
          alumno: parseInt(alumnoId),
          fecha_clase: fechaClase,
          estado,
        });
      }
      snackbar.show(`Asistencia registrada (${aRegistrar.length} alumno/s).`, 'success');
      setEstados({});
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <Cargando />;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📋 Tomar Asistencia
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField select label="Comisión" value={comisionId}
              onChange={(e) => setComisionId(e.target.value)}
              fullWidth size="small">
              <MenuItem value="">-- Seleccionar --</MenuItem>
              {comisiones.map((c) =>
                <MenuItem key={c.id} value={c.id}>
                  {c.materia_codigo} - {c.nombre}
                </MenuItem>
              )}
            </TextField>
            <TextField label="Fecha de la clase" value={fechaClase} disabled
              size="small" sx={{ minWidth: 200 }}
              helperText="Solo se puede registrar la fecha de hoy." />
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Marcar asistencia</Typography>
          <Tabla
            vacio="No hay alumnos cargados."
            columnas={[
              { key: 'alumno', label: 'Alumno',
                render: (a) => `${a.nombre_completo} (${a.username})` },
              { key: 'estado', label: 'Estado', render: (a) => (
                <TextField select size="small" value={estados[a.id] || ''}
                  onChange={(e) => setEstado(a.id, e.target.value)}
                  sx={{ minWidth: 160 }}>
                  <MenuItem value="">-- sin marcar --</MenuItem>
                  <MenuItem value="PRESENTE">Presente</MenuItem>
                  <MenuItem value="AUSENTE">Ausente</MenuItem>
                  <MenuItem value="JUSTIFICADO">Justificado</MenuItem>
                </TextField>
              ) },
            ]}
            datos={alumnos}
          />

          <Button variant="contained" onClick={guardar} disabled={guardando}
                  sx={{ mt: 2 }}>
            {guardando ? 'Guardando...' : 'Guardar Asistencia'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            🗂️ Asistencias Registradas
          </Typography>
          <Tabla
            vacio="Todavía no registraste asistencias."
            columnas={[
              { key: 'alumno_username', label: 'Alumno' },
              { key: 'materia', label: 'Materia' },
              { key: 'fecha_clase', label: 'Fecha',
                render: (a) => new Date(a.fecha_clase).toLocaleDateString() },
              { key: 'estado', label: 'Estado',
                render: (a) => <Badge estado={a.estado} texto={a.estado_display} /> },
            ]}
            datos={asistencias.slice(0, 50)}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
