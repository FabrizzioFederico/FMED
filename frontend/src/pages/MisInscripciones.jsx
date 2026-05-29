import { useEffect, useState } from 'react';
import { fetchMisInscripciones } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function MisInscripciones() {
  const [data, setData] = useState({ cursadas: [], finales: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMisInscripciones()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <>
      <div className="card">
        <h2>📚 Mis Cursadas</h2>
        {data.cursadas.length === 0 ? (
          <p className="empty">No tenés cursadas activas.</p>
        ) : (
          <TableWrapper>
            <table>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Comisión</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Inscripción</th>
                </tr>
              </thead>
              <tbody>
                {data.cursadas.map((c) => (
                  <tr key={c.id}>
                    <td>{c.materia}</td>
                    <td>{c.comision_nombre}</td>
                    <td>{c.horario}</td>
                    <td><span className="badge badge-info">{c.estado_display}</span></td>
                    <td>{new Date(c.fecha_inscripcion).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>

      <div className="card">
        <h2>📝 Mis Finales</h2>
        {data.finales.length === 0 ? (
          <p className="empty">No tenés finales inscriptos.</p>
        ) : (
          <TableWrapper>
            <table>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {data.finales.map((f) => (
                  <tr key={f.id}>
                    <td>{f.codigo_materia} - {f.materia}</td>
                    <td>{new Date(f.fecha_mesa).toLocaleString()}</td>
                    <td><span className="badge badge-info">{f.estado_display}</span></td>
                    <td><code>{f.codigo_comprobante}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </div>
    </>
  );
}
