import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

import {
  fetchUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
} from '../../api/endpoints.js';
import { Badge, Cargando, Vacio, mensajeError } from '../../components/ui.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

const VACIO = {
  username: '', password: '', email: '',
  first_name: '', last_name: '',
  rol: 'ALUMNO', dni: '', telefono: '',
};

function validarCampo(name, valor, editando) {
  const v = (valor || '').trim();
  switch (name) {
    case 'username':
      if (v.length < 3) return 'Debe tener al menos 3 caracteres.';
      return '';
    case 'first_name':
    case 'last_name':
      if (v.length < 2) return 'Debe tener al menos 2 caracteres.';
      if (/\d/.test(v)) return 'No puede contener números.';
      return '';
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email inválido.';
      return '';
    case 'dni':
      if (!/^\d{8}$/.test(v)) return 'El DNI debe tener exactamente 8 dígitos.';
      return '';
    case 'telefono':
      if (!v) return 'El teléfono es obligatorio.';
      if (!/^\d{11}$/.test(v)) return 'El teléfono debe tener exactamente 11 dígitos.';
      return '';
    case 'password':
      if (editando && !v) return '';  
      if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
      return '';
    default:
      return '';
  }
}

function Campo({ name, label, type = 'text', valor, error, editando, onCambio }) {
  const esNumerico = name === 'dni' || name === 'telefono';
  const maxLen = name === 'dni' ? 8 : name === 'telefono' ? 11 : undefined;

  function onChange(e) {
    let v = e.target.value;
    if (esNumerico) v = v.replace(/\D/g, '').slice(0, maxLen);
    onCambio(name, v);
  }

  return (
    <TextField
      label={label + (name === 'password' && editando ? ' (vacío = no cambiar)' : '')}
      type={type}
      value={valor}
      onChange={onChange}
      error={!!error}
      helperText={error || ' '}
      fullWidth size="small"
      inputProps={{
        inputMode: esNumerico ? 'numeric' : undefined,
        maxLength: maxLen,
      }}
    />
  );
}


export default function Usuarios() {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setLoading(true);
    fetchUsuarios(filtroRol)
      .then(setItems)
      .catch((e) => snackbar.show(mensajeError(e), 'error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [filtroRol]);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(VACIO);
    setErrores({});
    setModalAbierto(true);
  }

  function abrirEditar(u) {
    setEditandoId(u.id);
    setForm({
      username: u.username, password: '', email: u.email || '',
      first_name: u.first_name || '', last_name: u.last_name || '',
      rol: u.rol, dni: u.dni || '', telefono: u.telefono || '',
    });
    setErrores({});
    setModalAbierto(true);
  }

  function setCampo(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrores((e) => ({ ...e, [name]: validarCampo(name, value, !!editandoId) }));
  }

  async function guardar(e) {
    e.preventDefault();
    
    const nuevosErrores = {};
    Object.keys(VACIO).forEach((name) => {
      if (name === 'rol') return;
      const err = validarCampo(name, form[name], !!editandoId);
      if (err) nuevosErrores[name] = err;
    });
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      snackbar.show('Revisá los errores del formulario.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const payload = { ...form };
      if (editandoId && !payload.password) delete payload.password;

      if (editandoId) {
        await actualizarUsuario(editandoId, payload);
        snackbar.show('Usuario actualizado.', 'success');
      } else {
        await crearUsuario(payload);
        snackbar.show(`Usuario "${payload.username}" creado.`, 'success');
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
    if (!confirm('¿Eliminar este usuario? No se puede deshacer.')) return;
    try {
      await eliminarUsuario(id);
      snackbar.show('Usuario eliminado.', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err), 'error');
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
               alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary">👥 Gestión de Usuarios</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevo}>
            Nuevo usuario
          </Button>
        </Stack>

        <TextField select label="Filtrar por rol" value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          size="small" sx={{ minWidth: 220, mb: 2 }}>
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ALUMNO">Solo alumnos</MenuItem>
          <MenuItem value="PROFESOR">Solo profesores</MenuItem>
          <MenuItem value="ADMINISTRATIVO">Solo administrativos</MenuItem>
        </TextField>

        {loading ? <Cargando /> : items.length === 0 ? (
          <Vacio>No hay usuarios cargados.</Vacio>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DNI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.nombre_completo}</TableCell>
                    <TableCell>{u.email || '-'}</TableCell>
                    <TableCell>{u.dni || '-'}</TableCell>
                    <TableCell><Badge estado={u.rol} texto={u.rol_display} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary"
                        onClick={() => abrirEditar(u)} title="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error"
                        onClick={() => eliminar(u.id)} title="Eliminar">
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

      <Dialog open={modalAbierto} onClose={() => setModalAbierto(false)}
              maxWidth="sm" fullWidth>
        <DialogTitle>{editandoId ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <Box component="form" onSubmit={guardar}>
          <DialogContent dividers>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}>
              <TextField select label="Rol" value={form.rol}
                onChange={(e) => setCampo('rol', e.target.value)}
                fullWidth size="small">
                <MenuItem value="ALUMNO">Alumno</MenuItem>
                <MenuItem value="PROFESOR">Profesor</MenuItem>
                <MenuItem value="ADMINISTRATIVO">Administrativo</MenuItem>
              </TextField>
              <Campo name="username" label="Nombre de usuario"
                valor={form.username} error={errores.username}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="first_name" label="Nombre"
                valor={form.first_name} error={errores.first_name}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="last_name" label="Apellido"
                valor={form.last_name} error={errores.last_name}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="email" label="Email" type="email"
                valor={form.email} error={errores.email}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="dni" label="DNI (8 dígitos)"
                valor={form.dni} error={errores.dni}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="telefono" label="Teléfono (11 dígitos)"
                valor={form.telefono} error={errores.telefono}
                editando={!!editandoId} onCambio={setCampo} />
              <Campo name="password" label="Contraseña" type="password"
                valor={form.password} error={errores.password}
                editando={!!editandoId} onCambio={setCampo} />
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
