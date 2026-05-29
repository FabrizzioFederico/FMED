import { useEffect, useState } from 'react';
import { fetchTramitesPendientes, resolverTramite } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function TramitesPendientes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  function cargar() {
    setLoading(true);
    fetchTramitesPendientes()
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleAprobar(id) {
    setMensaje(null);
    try {
      await resolverTramite(id, true);
      setMensaje({ tipo: 'success', texto: 'Trámite aprobado.' });
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'Error.' });
    }
  }

  async function handleRechazar(id) {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    setMensaje(null);
    try {
      await resolverTramite(id, false, motivo);
      setMensaje({ tipo: 'success', texto: 'Trámite rechazado.' });
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'Error.' });
    }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📥 Trámites Pendientes</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Validá los trámites solicitados por los alumnos. Cada acción
        queda registrada en el log de auditoría.
      </p>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {items.length === 0 ? (
        <p className="empty">No hay trámites pendientes 🎉</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>{t.alumno_username}</td>
                  <td>{t.tipo_display}</td>
                  <td>{t.descripcion || '-'}</td>
                  <td>{new Date(t.fecha_solicitud).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAprobar(t.id)}>Aprobar</button>
                    <button className="danger" onClick={() => handleRechazar(t.id)}>
                      Rechazar
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
