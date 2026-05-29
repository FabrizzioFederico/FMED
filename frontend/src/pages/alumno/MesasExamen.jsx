import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fetchMesasExamen, inscribirAFinal } from '../../api/endpoints.js';
import { Badge, Cargando, mensajeError } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';
import { useSnackbar } from '../../context/SnackbarContext.jsx';


export default function MesasExamen() {
  const snackbar = useSnackbar();
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(null);

  function cargar() {
    setLoading(true);
    fetchMesasExamen().then(setMesas).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function inscribir(mesaId) {
    setInscribiendo(mesaId);
    try {
      const resp = await inscribirAFinal(mesaId);
      snackbar.show(
        `¡Inscripción exitosa! Comprobante: ${resp.codigo_comprobante}`,
        'success',
      );
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
          📅 Mesas de Examen Disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Al inscribirte, el sistema valida que seas regular en la materia,
          que tengas las correlativas aprobadas y que tu legajo no tenga deudas.
        </Typography>

        <Tabla
          vacio="No hay mesas disponibles por el momento."
          columnas={[
            { key: 'materia', label: 'Materia',
              render: (m) => `${m.materia_codigo} - ${m.materia_nombre}` },
            { key: 'fecha', label: 'Fecha y hora',
              render: (m) => new Date(m.fecha).toLocaleString() },
            { key: 'cupo', label: 'Cupo',
              render: (m) => `${m.lugares_libres} / ${m.cupo}` },
            { key: 'estado', label: 'Estado',
              render: (m) => (
                <Badge estado={m.cerrada ? 'CERRADA' : 'ABIERTA'}
                       texto={m.cerrada ? 'Cerrada' : 'Abierta'} />
              ) },
            { key: 'accion', label: 'Acción', align: 'right',
              render: (m) => (
                <Button variant="contained" size="small"
                  onClick={() => inscribir(m.id)}
                  disabled={m.cerrada || m.lugares_libres === 0 || inscribiendo === m.id}>
                  {inscribiendo === m.id ? 'Inscribiendo...' : 'Inscribirme'}
                </Button>
              ) },
          ]}
          datos={mesas}
        />
      </CardContent>
    </Card>
  );
}
