import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fetchComisiones, inscribirACursada } from '../../api/endpoints.js';
import { Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function InscripcionCursadas() {
  const snackbar = useSnackbar();
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(null);

  function cargar() {
    setLoading(true);
    fetchComisiones().then(setComisiones).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function inscribir(comisionId) {
    setInscribiendo(comisionId);
    try {
      await inscribirACursada(comisionId);
      snackbar.show('¡Inscripción a la cursada exitosa!', 'success');
      cargar();
    } catch (err) {
      snackbar.show(mensajeError(err, 'Error al inscribirse.'), 'error');
    } finally {
      setInscribiendo(null);
    }
  }

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          🎓 Comisiones Disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Inscribite a la cursada de una materia. El sistema validará que
          cumplas las correlativas y que haya cupo disponible.
        </Typography>

        <Tabla
          vacio="No hay comisiones disponibles."
          columnas={[
            { key: 'materia', label: 'Materia',
              render: (c) => `${c.materia_codigo} - ${c.materia_nombre}` },
            { key: 'nombre', label: 'Comisión' },
            { key: 'periodo_nombre', label: 'Período' },
            { key: 'horario', label: 'Horario' },
            { key: 'cupo', label: 'Cupo',
              render: (c) => `${c.lugares_libres} / ${c.cupo}` },
            { key: 'accion', label: 'Acción', align: 'right',
              render: (c) => (
                <Button variant="contained" size="small"
                  onClick={() => inscribir(c.id)}
                  disabled={c.lugares_libres === 0 || inscribiendo === c.id}>
                  {inscribiendo === c.id ? 'Inscribiendo...' : 'Inscribirme'}
                </Button>
              ) },
          ]}
          datos={comisiones}
        />
      </CardContent>
    </Card>
  );
}
