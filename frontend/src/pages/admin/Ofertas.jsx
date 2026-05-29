import { useEffect, useState } from 'react';
import CrudPage from '../../components/CrudPage.jsx';
import { Cargando } from '../../components/ui.jsx';
import {
  fetchOfertas, crearOferta, actualizarOferta, eliminarOferta,
  fetchInstituciones,
} from '../../api/endpoints.js';

export default function Ofertas() {
  const [instituciones, setInstituciones] = useState(null);

  useEffect(() => { fetchInstituciones().then(setInstituciones); }, []);

  if (instituciones === null) return <Cargando />;

  return (
    <CrudPage
      titulo="Oferta"
      textoNuevo="Nueva oferta"
      api={{ listar: fetchOfertas, crear: crearOferta,
             actualizar: actualizarOferta, eliminar: eliminarOferta }}
      valoresIniciales={{
        institucion: '', titulo: '', descripcion: '',
        tipo: 'PASANTIA', requisitos: '', fecha_cierre: '',
        estado: 'ABIERTA',
      }}
      columnas={[
        { key: 'titulo', label: 'Título' },
        { key: 'institucion_nombre', label: 'Institución' },
        { key: 'tipo_display', label: 'Tipo' },
        { key: 'estado_display', label: 'Estado' },
        { key: 'cantidad_postulantes', label: 'Postulantes' },
      ]}
      campos={[
        { name: 'institucion', label: 'Institución', type: 'select',
          options: instituciones.map((i) => ({ value: i.id, label: i.nombre })) },
        { name: 'titulo', label: 'Título de la oferta', full: true },
        { name: 'descripcion', label: 'Descripción', type: 'textarea', full: true },
        { name: 'tipo', label: 'Tipo', type: 'select',
          options: [
            { value: 'RESIDENCIA', label: 'Residencia' },
            { value: 'PASANTIA', label: 'Pasantía' },
            { value: 'EMPLEO', label: 'Empleo' },
          ] },
        { name: 'estado', label: 'Estado', type: 'select',
          options: [
            { value: 'ABIERTA', label: 'Abierta' },
            { value: 'CERRADA', label: 'Cerrada' },
          ] },
        { name: 'requisitos', label: 'Requisitos', type: 'textarea',
          full: true, required: false },
        { name: 'fecha_cierre', label: 'Fecha de cierre',
          type: 'date', required: false },
      ]}
    />
  );
}
