import { useEffect, useState } from 'react';
import { fetchMisPostulaciones } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function MisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisPostulaciones()
      .then((data) => setPostulaciones(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;

  function badgeClase(estado) {
    if (estado === 'ACEPTADO') return 'badge-success';
    if (estado === 'RECHAZADO') return 'badge-error';
    if (estado === 'PRESELECCIONADO') return 'badge-info';
    return 'badge-warning';
  }

  return (
    <div className="card">
      <h2>💼 Mis Postulaciones</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
        Seguí el estado de tus postulaciones a ofertas de trabajo.
      </p>

      {postulaciones.length === 0 ? (
        <p className="empty">Todavía no te postulaste a ninguna oferta.</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Institución</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((p) => (
                <tr key={p.id}>
                  <td>{p.oferta_titulo}</td>
                  <td>{p.institucion_nombre}</td>
                  <td>{p.oferta_tipo_display}</td>
                  <td>{new Date(p.fecha_postulacion).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${badgeClase(p.estado)}`}>
                      {p.estado_display}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
