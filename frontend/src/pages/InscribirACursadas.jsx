import { useEffect, useState } from 'react';
import { fetchComisiones, inscribirACursada } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function InscribirACursadas() {
  const [comisiones, setComisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(null);

  function cargarComisiones() {
    setLoading(true);
    fetchComisiones()
      .then((data) => setComisiones(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargarComisiones(); }, []);

  async function handleInscribir(comisionId) {
    setMensaje(null);
    setInscribiendo(comisionId);
    try {
      await inscribirACursada(comisionId);
      setMensaje({
        tipo: 'success',
        texto: '¡Inscripción exitosa! Ahora sos parte de la cursada.',
      });
      cargarComisiones();
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
      <h2>📚 Inscribirse a Cursada</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
        Selecciona la comisión a la que deseas inscribirte.
        El sistema validará que cumples los requisitos (correlativas, deuda documental, etc.).
      </p>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {comisiones.length === 0 ? (
        <p className="empty">No hay comisiones disponibles por el momento.</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Comisión</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Cupo disponible</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {comisiones.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.materia_codigo}</strong>
                    <br />
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                      {c.materia_nombre}
                    </span>
                  </td>
                  <td>{c.comision_nombre}</td>
                  <td>{c.horario}</td>
                  <td>{c.aula || '—'}</td>
                  <td>{c.lugares_libres} / {c.cupo}</td>
                  <td>
                    <button
                      onClick={() => handleInscribir(c.id)}
                      disabled={c.lugares_libres === 0 || inscribiendo === c.id}
                    >
                      {inscribiendo === c.id ? 'Inscribiendo...' : 'Inscribirse'}
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
