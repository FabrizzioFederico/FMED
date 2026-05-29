import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fetchPostulaciones } from '../../api/endpoints.js';
import { Badge, Cargando } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';


export default function MisPostulaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostulaciones().then(setItems).finally(() => setLoading(false));
  }, []);

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          💼 Mis Postulaciones
        </Typography>
        <Tabla
          vacio="No te postulaste a ninguna oferta todavía."
          columnas={[
            { key: 'oferta_titulo', label: 'Oferta' },
            { key: 'estado', label: 'Estado',
              render: (p) => <Badge estado={p.estado} texto={p.estado_display} /> },
            { key: 'fecha_postulacion', label: 'Fecha',
              render: (p) => new Date(p.fecha_postulacion).toLocaleDateString() },
            { key: 'mensaje', label: 'Mensaje',
              render: (p) => p.mensaje || '-' },
          ]}
          datos={items}
        />
      </CardContent>
    </Card>
  );
}
