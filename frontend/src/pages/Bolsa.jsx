import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import WorkIcon from '@mui/icons-material/Work';

import { fetchOfertas, postularse } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, Cargando, Vacio, mensajeError } from '../components/ui.jsx';
import { useSnackbar } from '../context/SnackbarContext.jsx';


export default function Bolsa() {
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ofertaActiva, setOfertaActiva] = useState(null);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [postulando, setPostulando] = useState(false);

  function cargar() {
    setLoading(true);
    fetchOfertas().then(setOfertas).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function confirmar() {
    setPostulando(true);
    try {
      await postularse(ofertaActiva.id, textoMensaje);
      snackbar.show('Postulación enviada con éxito.', 'success');
      setOfertaActiva(null);
      setTextoMensaje('');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err, 'Ya estás postulado o hubo un error.'), 'error');
    } finally {
      setPostulando(false);
    }
  }

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <WorkIcon color="primary" />
          <Typography variant="h6" color="primary">Bolsa de Trabajo</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ofertas de residencias, pasantías y empleo de instituciones de salud.
        </Typography>

        {ofertas.length === 0 ? (
          <Vacio>No hay ofertas publicadas.</Vacio>
        ) : (
          <Grid container spacing={2}>
            {ofertas.map((o) => (
              <Grid item xs={12} md={6} lg={4} key={o.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between"
                           alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {o.titulo}
                      </Typography>
                      <Badge estado={o.estado} texto={o.estado_display} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary"
                                sx={{ display: 'block', mb: 1 }}>
                      {o.institucion_nombre} · {o.tipo_display}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {o.descripcion}
                    </Typography>
                    {o.requisitos && (
                      <Typography variant="caption" color="text.secondary"
                                  sx={{ display: 'block', mb: 1 }}>
                        <strong>Requisitos:</strong> {o.requisitos}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {o.cantidad_postulantes} postulante(s)
                      {o.fecha_cierre &&
                        ` · Cierra ${new Date(o.fecha_cierre).toLocaleDateString()}`}
                    </Typography>
                    {user?.rol === 'ALUMNO' && o.estado === 'ABIERTA' && (
                      <Box sx={{ mt: 2 }}>
                        <Button variant="contained" size="small"
                                onClick={() => setOfertaActiva(o)}>
                          Postularme
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>

      <Dialog open={!!ofertaActiva} onClose={() => setOfertaActiva(null)}
              maxWidth="sm" fullWidth>
        <DialogTitle>Postularme: {ofertaActiva?.titulo}</DialogTitle>
        <DialogContent>
          <TextField
            label="Mensaje para la institución (opcional)"
            multiline rows={4} fullWidth autoFocus
            value={textoMensaje}
            onChange={(e) => setTextoMensaje(e.target.value)}
            placeholder="Contá brevemente por qué te interesa esta oferta..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfertaActiva(null)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmar} disabled={postulando}>
            {postulando ? 'Enviando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
