import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { fetchComisiones } from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Cargando } from '../../components/ui.jsx';
import Tabla from '../../components/Tabla.jsx';


export default function MisComisiones() {
  const { user } = useAuth();
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComisiones()
      .then((todas) => setComisiones(
        todas.filter((c) => (c.profesores || []).includes(user.id))
      ))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Cargando />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          🎓 Mis Comisiones
        </Typography>
        <Tabla
          vacio="No tenés comisiones asignadas."
          columnas={[
            { key: 'materia', label: 'Materia',
              render: (c) => `${c.materia_codigo} - ${c.materia_nombre}` },
            { key: 'nombre', label: 'Comisión' },
            { key: 'periodo_nombre', label: 'Período' },
            { key: 'aula_nombre', label: 'Aula', render: (c) => c.aula_nombre || '-' },
            { key: 'horario', label: 'Horario' },
            { key: 'inscriptos', label: 'Inscriptos',
              render: (c) => `${c.cupo - c.lugares_libres} / ${c.cupo}` },
          ]}
          datos={comisiones}
        />
      </CardContent>
    </Card>
  );
}
