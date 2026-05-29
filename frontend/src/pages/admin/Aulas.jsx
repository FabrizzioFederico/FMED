import CrudPage from '../../components/CrudPage.jsx';
import {
  fetchAulas, crearAula, actualizarAula, eliminarAula,
} from '../../api/endpoints.js';

export default function Aulas() {
  return (
    <CrudPage
      titulo="Aula"
      textoNuevo="Nueva aula"
      api={{ listar: fetchAulas, crear: crearAula,
             actualizar: actualizarAula, eliminar: eliminarAula }}
      valoresIniciales={{ nombre: '', capacidad: 30 }}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'capacidad', label: 'Capacidad' },
      ]}
      campos={[
        { name: 'nombre', label: 'Nombre del aula' },
        { name: 'capacidad', label: 'Capacidad (máx. 200)', type: 'number', min: 1, max: 200 },
      ]}
    />
  );
}
