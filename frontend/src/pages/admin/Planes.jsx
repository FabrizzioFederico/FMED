import CrudPage from '../../components/CrudPage.jsx';
import {
  fetchPlanes, crearPlan, actualizarPlan, eliminarPlan,
} from '../../api/endpoints.js';

export default function Planes() {
  return (
    <CrudPage
      titulo="Plan de Estudio"
      textoNuevo="Nuevo plan"
      api={{ listar: fetchPlanes, crear: crearPlan,
             actualizar: actualizarPlan, eliminar: eliminarPlan }}
      valoresIniciales={{ nombre: '', anio_vigencia: '', activo: true }}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'anio_vigencia', label: 'Año de vigencia' },
        { key: 'activo', label: 'Activo',
          render: (i) => (i.activo ? 'Sí' : 'No') },
      ]}
      campos={[
        { name: 'nombre', label: 'Nombre del plan', full: true },
        { name: 'anio_vigencia', label: 'Año de vigencia', type: 'number' },
        { name: 'activo', label: '¿Está activo?', type: 'checkbox', required: false },
      ]}
    />
  );
}
