import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { Cargando, Vacio, mensajeError } from './ui.jsx';
import { useSnackbar } from '../context/SnackbarContext.jsx';

function hoyISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 10);
}
function finDeAnioISO() {
  return `${new Date().getFullYear()}-12-31`;
}
function limiteMin(campo) {
  if (campo.type === 'date') return hoyISO();
  if (campo.type === 'datetime-local') return `${hoyISO()}T00:00`;
  return campo.min;
}
function limiteMax(campo) {
  if (campo.type === 'date') return finDeAnioISO();
  if (campo.type === 'datetime-local') return `${finDeAnioISO()}T23:59`;
  return campo.max;
}


export default function CrudPage({
  titulo,
  columnas,
  campos,
  api,
  valoresIniciales,
  textoNuevo = 'Nuevo',
}) {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setLoading(true);
    api.listar()
      .then(setItems)
      .catch((e) => snackbar.show(mensajeError(e), 'error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(valoresIniciales);
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditandoId(item.id);
    const datos = {};
    campos.forEach((c) => {
      datos[c.name] = item[c.name] ?? valoresIniciales[c.name];
    });
    setForm(datos);
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      payload[k] = v === '' ? null : v;
    });
    try {
      if (editandoId) {
        await api.actualizar(editandoId, payload);
        snackbar.show(`${titulo}: registro actualizado.`, 'success');
      } else {
        await api.crear(payload);
        snackbar.show(`${titulo}: registro creado.`, 'success');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Seguro que querés eliminar este registro?')) return;
    try {
      await api.eliminar(id);
      snackbar.show('Registro eliminado.', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  function setCampo(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
               alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary">{titulo}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>
            {textoNuevo}
          </Button>
        </Stack>

        {loading ? (
          <Cargando />
        ) : items.length === 0 ? (
          <Vacio>No hay registros cargados.</Vacio>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {columnas.map((c) =>
                    <TableCell key={c.key} sx={{ fontWeight: 600 }}>{c.label}</TableCell>
                  )}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    {columnas.map((c) => (
                      <TableCell key={c.key}>
                        {c.render ? c.render(item) : item[c.key]}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" color="primary"
                        onClick={() => abrirEditar(item)} title="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error"
                        onClick={() => eliminar(item.id)} title="Eliminar">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Modal de creación/edición */}
      <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)}
              maxWidth="sm" fullWidth>
        <DialogTitle>
          {editandoId ? `Editar ${titulo}` : `Nuevo ${titulo}`}
        </DialogTitle>
        <Box component="form" onSubmit={guardar}>
          <DialogContent dividers>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}>
              {campos.map((campo) => (
                <Box key={campo.name}
                     sx={{ gridColumn: campo.full ? '1 / -1' : 'auto' }}>
                  {campo.type === 'checkbox' ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!form[campo.name]}
                          onChange={(e) => setCampo(campo.name, e.target.checked)}
                        />
                      }
                      label={campo.label}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label={campo.label}
                      type={campo.type || 'text'}
                      select={campo.type === 'select'}
                      multiline={campo.type === 'textarea'}
                      rows={campo.type === 'textarea' ? 3 : undefined}
                      value={form[campo.name] ?? ''}
                      onChange={(e) => setCampo(campo.name, e.target.value)}
                      required={campo.required !== false}
                      InputLabelProps={
                        ['date', 'datetime-local', 'time'].includes(campo.type)
                          ? { shrink: true } : undefined
                      }
                      inputProps={{
                        min: limiteMin(campo),
                        max: limiteMax(campo),
                        step: campo.step,
                        minLength: campo.minLength,
                        maxLength: campo.maxLength,
                      }}
                    >
                      {campo.type === 'select' &&
                        campo.options.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))
                      }
                    </TextField>
                  )}
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalAbierto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
}
