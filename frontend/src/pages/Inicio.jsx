import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchMisInscripciones, fetchMisCalificaciones, fetchActas,
  fetchTramitesPendientes, fetchDocumentosPendientes,
  fetchMaterias, fetchComisiones, fetchOfertas,
} from '../api/endpoints.js';
import { Cargando } from '../components/ui.jsx';


function Stat({ numero, label, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h3" sx={{ fontWeight: 700, color }}>
          {numero}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}


export default function Inicio() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        if (user.rol === 'ALUMNO') {
          const [insc, cal] = await Promise.all([
            fetchMisInscripciones(), fetchMisCalificaciones(),
          ]);
          setStats([
            { numero: insc.cursadas.length, label: 'Cursadas activas' },
            { numero: insc.finales.length, label: 'Finales inscriptos' },
            { numero: cal.length, label: 'Notas registradas' },
          ]);
        } else if (user.rol === 'PROFESOR') {
          const [actas, comis] = await Promise.all([
            fetchActas(), fetchComisiones(),
          ]);
          const propias = comis.filter((c) =>
            (c.profesores || []).includes(user.id));
          setStats([
            { numero: propias.length, label: 'Mis comisiones' },
            { numero: actas.length, label: 'Actas creadas' },
            { numero: actas.filter((a) => a.estado === 'PROVISORIA').length,
              label: 'Actas abiertas' },
          ]);
        } else {
          const [mat, tram, docs, ofer] = await Promise.all([
            fetchMaterias(), fetchTramitesPendientes(),
            fetchDocumentosPendientes(), fetchOfertas(),
          ]);
          setStats([
            { numero: mat.length, label: 'Materias' },
            { numero: tram.length, label: 'Trámites pendientes' },
            { numero: docs.length, label: 'Documentos por validar' },
            { numero: ofer.length, label: 'Ofertas publicadas' },
          ]);
        }
      } catch {
        setStats([]);
      }
    }
    cargar();
  }, [user]);

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Bienvenido, {user?.nombre_completo} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sesión iniciada como <strong>{user?.rol_display}</strong>.
            Usá el menú lateral para navegar por el sistema.
          </Typography>
        </CardContent>
      </Card>

      {stats === null ? (
        <Cargando />
      ) : (
        <Grid container spacing={2}>
          {stats.map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Stat numero={s.numero} label={s.label} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
