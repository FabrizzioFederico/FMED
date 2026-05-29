import CrudPage from '../../components/CrudPage.jsx';
import {
  fetchInstituciones, crearInstitucion,
  actualizarInstitucion, eliminarInstitucion,
} from '../../api/endpoints.js';

export default function Instituciones() {
  return (
    <CrudPage
      titulo="Institución"
      textoNuevo="Nueva institución"
      api={{ listar: fetchInstituciones, crear: crearInstitucion,
             actualizar: actualizarInstitucion, eliminar: eliminarInstitucion }}
      valoresIniciales={{
        nombre: '', cuit: '', email_contacto: '',
        telefono: '', direccion: '', activa: true,
      }}
      columnas={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'cuit', label: 'CUIT' },
        { key: 'email_contacto', label: 'Email' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'activa', label: 'Activa',
          render: (i) => (i.activa ? 'Sí' : 'No') },
      ]}
      campos={[
        { name: 'nombre', label: 'Nombre de la institución', full: true },
        { name: 'cuit', label: 'CUIT', required: false },
        { name: 'email_contacto', label: 'Email de contacto',
          type: 'email', required: false },
        { name: 'telefono', label: 'Teléfono', required: false },
        { name: 'direccion', label: 'Dirección', full: true, required: false },
        { name: 'activa', label: '¿Está activa?', type: 'checkbox', required: false },
      ]}
    />
  );
}
