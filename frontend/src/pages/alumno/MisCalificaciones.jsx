import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fetchMisCalificaciones } from '../../api/endpoints.js';
import { Cargando } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';


export default function MisCalificaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisCalificaciones().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          📊 Mis Calificaciones
        </Typography>
        <Tabla
          vacio="Todavía no tenés calificaciones cargadas."
          columnas={[
            { key: 'materia', label: 'Materia', render: (c) => c.materia || '-' },
            { key: 'nota', label: 'Nota', render: (c) => (
                <Box sx={{
                  fontWeight: 700,
                  color: parseFloat(c.nota) >= 4 ? 'success.main' : 'error.main',
                }}>{c.nota}</Box>
              ) },
            { key: 'observaciones', label: 'Observaciones',
              render: (c) => c.observaciones || '-' },
          ]}
          datos={items}
        />
      </CardContent>
    </Card>
  );
}
