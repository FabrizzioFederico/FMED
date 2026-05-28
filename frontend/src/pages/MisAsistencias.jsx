import { useEffect, useState } from 'react';
import { fetchMisAsistencias } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function MisAsistencias() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisAsistencias()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;

  function badgeClase(estado) {
    if (estado === 'PRESENTE') return 'badge-success';
    if (estado === 'JUSTIFICADO') return 'badge-info';
    return 'badge-error';
  }

  return (
    <div className="card">
      <h2>📋 Mis Asistencias</h2>
      {items.length === 0 ? (
        <p className="empty">No hay asistencias registradas.</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Fecha de clase</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.materia}</td>
                  <td>{new Date(a.fecha_clase).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${badgeClase(a.estado)}`}>
                      {a.estado_display}
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
