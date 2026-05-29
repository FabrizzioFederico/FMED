import { useEffect, useState } from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import { Cargando } from '../../components/ui.jsx';
import {
  fetchMaterias, crearMateria, actualizarMateria, eliminarMateria,
  fetchPlanes,
} from '../../api/endpoints.js';

export default function Materias() {
  const [planes, setPlanes] = useState(null);

  useEffect(() => { fetchPlanes().then(setPlanes); }, []);

  if (planes === null) return <Cargando />;

  return (
    <CrudPage
      titulo="Materia"
      textoNuevo="Nueva materia"
      api={{ listar: fetchMaterias, crear: crearMateria,
             actualizar: actualizarMateria, eliminar: eliminarMateria }}
      valoresIniciales={{
        plan: '', codigo: '', nombre: '', anio: 1,
        regimen: 'CUATRIMESTRAL', carga_horaria: 0,
      }}
      columnas={[
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'anio', label: 'Año' },
        { key: 'regimen_display', label: 'Régimen' },
        { key: 'plan_nombre', label: 'Plan' },
      ]}
      campos={[
        { name: 'plan', label: 'Plan de estudio', type: 'select',
          options: planes.map((p) => ({ value: p.id, label: p.nombre })) },
        { name: 'codigo', label: 'Código (ej: MED101)' },
        { name: 'nombre', label: 'Nombre de la materia', full: true },
        { name: 'anio', label: 'Año', type: 'number', min: 1 },
        { name: 'regimen', label: 'Régimen', type: 'select',
          options: [
            { value: 'ANUAL', label: 'Anual' },
            { value: 'CUATRIMESTRAL', label: 'Cuatrimestral' },
          ] },
        { name: 'carga_horaria', label: 'Carga horaria', type: 'number', min: 0 },
      ]}
    />
  );
}
