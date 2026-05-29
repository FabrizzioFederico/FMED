import { useEffect, useState } from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import { Cargando } from '../../components/ui.jsx';
import {
  fetchComisiones, crearComision, actualizarComision, eliminarComision,
  fetchMaterias, fetchPeriodos, fetchAulas,
} from '../../api/endpoints.js';

export default function Comisiones() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    Promise.all([fetchMaterias(), fetchPeriodos(), fetchAulas()])
      .then(([materias, periodos, aulas]) => setDatos({ materias, periodos, aulas }));
  }, []);

  if (datos === null) return <Cargando />;

  return (
    <CrudPage
      titulo="Comisión"
      textoNuevo="Nueva comisión"
      api={{ listar: fetchComisiones, crear: crearComision,
             actualizar: actualizarComision, eliminar: eliminarComision }}
      valoresIniciales={{
        materia: '', periodo: '', nombre: '',
        aula: '', horario: '', cupo: 40,
      }}
      columnas={[
        { key: 'materia_codigo', label: 'Materia' },
        { key: 'nombre', label: 'Comisión' },
        { key: 'periodo_nombre', label: 'Período' },
        { key: 'aula_nombre', label: 'Aula',
          render: (i) => i.aula_nombre || '-' },
        { key: 'horario', label: 'Horario' },
        { key: 'cupo', label: 'Cupo' },
      ]}
      campos={[
        { name: 'materia', label: 'Materia', type: 'select',
          options: datos.materias.map((m) => ({
            value: m.id, label: `${m.codigo} - ${m.nombre}`,
          })) },
        { name: 'periodo', label: 'Período lectivo', type: 'select',
          options: datos.periodos.map((p) => ({ value: p.id, label: p.nombre })) },
        { name: 'nombre', label: 'Nombre (ej: Comisión A)' },
        { name: 'aula', label: 'Aula', type: 'select', required: false,
          options: datos.aulas.map((a) => ({ value: a.id, label: a.nombre })) },
        { name: 'horario', label: 'Horario (ej: Lun y Mie 18-22)', full: true },
        { name: 'cupo', label: 'Cupo (máx. 200)', type: 'number', min: 1, max: 200 },
      ]}
    />
  );
}
