import { useEffect, useState } from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import { Cargando } from '../../components/ui.jsx';
import {
  fetchMesasExamen, crearMesaExamen, actualizarMesaExamen, eliminarMesaExamen,
  fetchMaterias,
} from '../../api/endpoints.js';

export default function Mesas() {
  const [materias, setMaterias] = useState(null);

  useEffect(() => { fetchMaterias().then(setMaterias); }, []);

  if (materias === null) return <Cargando />;

  return (
    <CrudPage
      titulo="Mesa de Examen"
      textoNuevo="Nueva mesa"
      api={{ listar: fetchMesasExamen, crear: crearMesaExamen,
             actualizar: actualizarMesaExamen, eliminar: eliminarMesaExamen }}
      valoresIniciales={{ materia: '', fecha: '', cupo: 50, cerrada: false }}
      columnas={[
        { key: 'materia_codigo', label: 'Materia' },
        { key: 'materia_nombre', label: 'Nombre' },
        { key: 'fecha', label: 'Fecha',
          render: (i) => new Date(i.fecha).toLocaleString() },
        { key: 'cupo', label: 'Cupo' },
        { key: 'cerrada', label: 'Estado',
          render: (i) => (i.cerrada ? 'Cerrada' : 'Abierta') },
      ]}
      campos={[
        { name: 'materia', label: 'Materia', type: 'select',
          options: materias.map((m) => ({
            value: m.id, label: `${m.codigo} - ${m.nombre}`,
          })) },
        { name: 'fecha', label: 'Fecha y hora', type: 'datetime-local' },
        { name: 'cupo', label: 'Cupo (máx. 200)', type: 'number', min: 1, max: 200 },
        { name: 'cerrada', label: '¿Mesa cerrada?', type: 'checkbox', required: false },
      ]}
    />
  );
}
