import { useEffect, useState } from 'react';
import { fetchMisCalificaciones } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function MisCalificaciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisCalificaciones()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📊 Mis Calificaciones</h2>
      {items.length === 0 ? (
        <p className="empty">Todavía no tenés calificaciones cargadas.</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Nota</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.materia || '-'}</td>
                  <td>
                    <strong style={{
                      color: parseFloat(c.nota) >= 4 ? '#065f46' : '#991b1b',
                    }}>
                      {c.nota}
                    </strong>
                  </td>
                  <td>{c.observaciones || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}
