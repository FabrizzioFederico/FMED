import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fetchMisAsistencias } from '../../api/endpoints.js';
import { Badge, Cargando } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';


export default function MisAsistencias() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisAsistencias().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <Cargando />;

  const porMateria = {};
  items.forEach((a) => {
    if (!porMateria[a.materia]) porMateria[a.materia] = { total: 0, presente: 0 };
    porMateria[a.materia].total++;
    if (a.estado === 'PRESENTE' || a.estado === 'JUSTIFICADO') {
      porMateria[a.materia].presente++;
    }
  });

  return (
    <Stack spacing={2}>
      {Object.keys(porMateria).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              📈 Resumen de Asistencia
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(porMateria).map(([materia, d]) => {
                const pct = Math.round((d.presente / d.total) * 100);
                return (
                  <Grid item xs={12} sm={6} md={4} key={materia}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4" sx={{ fontWeight: 700,
                          color: pct >= 75 ? 'success.main' : 'warning.main' }}>
                          {pct}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {materia} ({d.presente}/{d.total})
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            📋 Detalle de Asistencias
          </Typography>
          <Tabla
            vacio="No hay asistencias registradas."
            columnas={[
              { key: 'materia', label: 'Materia' },
              { key: 'fecha_clase', label: 'Fecha',
                render: (a) => new Date(a.fecha_clase).toLocaleDateString() },
              { key: 'estado', label: 'Estado',
                render: (a) => <Badge estado={a.estado} texto={a.estado_display} /> },
            ]}
            datos={items}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
