import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fetchMisInscripciones } from '../../api/endpoints.js';
import { Badge, Cargando } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';


export default function MisInscripciones() {
  const [data, setData] = useState({ cursadas: [], finales: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisInscripciones().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Cargando />;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📚 Mis Cursadas
          </Typography>
          <Tabla
            vacio="No tenés cursadas activas."
            columnas={[
              { key: 'materia', label: 'Materia' },
              { key: 'comision_nombre', label: 'Comisión' },
              { key: 'horario', label: 'Horario' },
              { key: 'estado', label: 'Estado',
                render: (c) => <Badge estado={c.estado} texto={c.estado_display} /> },
              { key: 'fecha_inscripcion', label: 'Inscripción',
                render: (c) => new Date(c.fecha_inscripcion).toLocaleDateString() },
            ]}
            datos={data.cursadas}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📝 Mis Finales
          </Typography>
          <Tabla
            vacio="No tenés finales inscriptos."
            columnas={[
              { key: 'materia', label: 'Materia',
                render: (f) => `${f.codigo_materia} - ${f.materia}` },
              { key: 'fecha_mesa', label: 'Fecha',
                render: (f) => new Date(f.fecha_mesa).toLocaleString() },
              { key: 'estado', label: 'Estado',
                render: (f) => <Badge estado={f.estado} texto={f.estado_display} /> },
              { key: 'codigo_comprobante', label: 'Comprobante',
                render: (f) => <code>{f.codigo_comprobante}</code> },
            ]}
            datos={data.finales}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
