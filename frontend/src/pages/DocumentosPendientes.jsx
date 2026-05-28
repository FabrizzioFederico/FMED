import { useEffect, useState } from 'react';
import { fetchDocumentosPendientes, validarDocumento } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function DocumentosPendientes() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  function cargar() {
    setLoading(true);
    fetchDocumentosPendientes()
      .then((data) => setDocumentos(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleAprobar(documentoId) {
    setMensaje(null);
    try {
      await validarDocumento(documentoId, true);
      setMensaje({ tipo: 'success', texto: 'Documento aprobado.' });
      cargar();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al validar.',
      });
    }
  }

  async function handleRechazar(documentoId) {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    setMensaje(null);
    try {
      await validarDocumento(documentoId, false, motivo);
      setMensaje({ tipo: 'success', texto: 'Documento rechazado.' });
      cargar();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al rechazar.',
      });
    }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📥 Documentos Pendientes de Validación</h2>
      <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
        Revisá los documentos subidos por los alumnos. Cada acción queda registrada
        en el log de auditoría.
      </p>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {documentos.length === 0 ? (
        <p className="empty">No hay documentos pendientes 🎉</p>
      ) : (
        <TableWrapper>
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Tipo</th>
                <th>Fecha de subida</th>
                <th>Archivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id}>
                  <td>{d.alumno_username}</td>
                  <td>{d.tipo_display}</td>
                  <td>{new Date(d.fecha_subida).toLocaleDateString()}</td>
                  <td>
                    <a href={d.archivo} target="_blank" rel="noreferrer" className="link">
                      Ver archivo ↗
                    </a>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAprobar(d.id)}>Aprobar</button>
                    <button className="danger" onClick={() => handleRechazar(d.id)}>
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
