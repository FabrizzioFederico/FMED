import CrudPage from '../../components/CrudPage.jsx';
import {
  fetchPeriodos, crearPeriodo, actualizarPeriodo, eliminarPeriodo,
} from '../../api/endpoints.js';

export default function Periodos() {
  return (
    <CrudPage
      titulo="Período Lectivo"
      textoNuevo="Nuevo período"
      api={{ listar: fetchPeriodos, crear: crearPeriodo,
             actualizar: actualizarPeriodo, eliminar: eliminarPeriodo }}
      valoresIniciales={{
        nombre: '', fecha_inicio: '', fecha_fin: '',
        inscripciones_abiertas: false,
      }}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'fecha_inicio', label: 'Inicio' },
        { key: 'fecha_fin', label: 'Fin' },
        { key: 'inscripciones_abiertas', label: 'Inscripciones',
          render: (i) => (i.inscripciones_abiertas ? 'Abiertas' : 'Cerradas') },
      ]}
      campos={[
        { name: 'nombre', label: 'Nombre del período', full: true },
        { name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date' },
        { name: 'fecha_fin', label: 'Fecha de fin', type: 'date' },
        { name: 'inscripciones_abiertas', label: '¿Inscripciones abiertas?',
          type: 'checkbox', required: false },
      ]}
    />
  );
}
