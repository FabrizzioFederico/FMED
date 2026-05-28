import { useEffect, useState } from 'react';
import { fetchMesasExamen, inscribirAFinal } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function MesasExamen() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null); // {tipo: 'success'|'error', texto: ''}
  const [inscribiendo, setInscribiendo] = useState(null);

  function cargarMesas() {
    setLoading(true);
    fetchMesasExamen()
      .then((data) => setMesas(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargarMesas(); }, []);

  async function handleInscribir(mesaId) {
    setMensaje(null);
    setInscribiendo(mesaId);
    try {
      const resp = await inscribirAFinal(mesaId);
      setMensaje({
        tipo: 'success',
        texto: `¡Inscripción exitosa! Comprobante: ${resp.codigo_comprobante}`,
      });
      cargarMesas(); // refresca cupos
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al inscribirse.',
      });
    } finally {
      setInscribiendo(null);
    }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📅 Mesas de Examen Disponibles</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Para inscribirte, el sistema validará que seas regular en la materia,
        que tengas las correlativas aprobadas y que no haya deudas en tu legajo.
      </p>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {mesas.length === 0 ? (
        <p className="empty">No hay mesas disponibles por el momento.</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Fecha y hora</th>
                <th>Cupo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((m) => (
                <tr key={m.id}>
                  <td>{m.materia_codigo} - {m.materia_nombre}</td>
                  <td>{new Date(m.fecha).toLocaleString()}</td>
                  <td>{m.lugares_libres} / {m.cupo}</td>
                  <td>
                    {m.cerrada
                      ? <span className="badge badge-error">Cerrada</span>
                      : <span className="badge badge-success">Abierta</span>}
                  </td>
                  <td>
                    <button
                      onClick={() => handleInscribir(m.id)}
                      disabled={m.cerrada || m.lugares_libres === 0 || inscribiendo === m.id}
                    >
                      {inscribiendo === m.id ? 'Inscribiendo...' : 'Inscribirme'}
                    </button>
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
