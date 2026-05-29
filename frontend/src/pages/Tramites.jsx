import { useEffect, useState } from 'react';
import { crearTramite, fetchMisTramites } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

const TIPOS = [
  { value: 'CERT_REGULAR', label: 'Certificado de alumno regular' },
  { value: 'CERT_MATERIAS', label: 'Certificado de materias aprobadas' },
  { value: 'ANALITICO', label: 'Analítico parcial' },
  { value: 'TITULO', label: 'Solicitud de título' },
  { value: 'OTRO', label: 'Otro' },
];

export default function Tramites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('CERT_REGULAR');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  function cargar() {
    fetchMisTramites()
      .then((data) => setItems(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      await crearTramite({ tipo, descripcion });
      setMensaje({ tipo: 'success', texto: 'Trámite solicitado correctamente.' });
      setDescripcion('');
      cargar();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al solicitar.',
      });
    } finally {
      setEnviando(false);
    }
  }

  function badgeClase(estado) {
    if (estado === 'APROBADO') return 'badge-success';
    if (estado === 'RECHAZADO') return 'badge-error';
    return 'badge-warning';
  }

  return (
    <>
      <div className="card">
        <h2>📋 Solicitar Trámite</h2>
        {mensaje && (
          <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales..."
            />
          </div>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Solicitar'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>📜 Mis Trámites</h2>
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : items.length === 0 ? (
          <p className="empty">No solicitaste trámites todavía.</p>
        ) : (
          <TableWrapper>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Código verificación</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tipo_display}</td>
                    <td>
                      <span className={`badge ${badgeClase(t.estado)}`}>
                        {t.estado_display}
                      </span>
                    </td>
                    <td>{new Date(t.fecha_solicitud).toLocaleDateString()}</td>
                    <td>
                      {t.codigo_qr_verificacion
                        ? <code style={{ fontSize: '0.75rem' }}>{t.codigo_qr_verificacion.slice(0, 20)}...</code>
                        : '-'}
                    </td>
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
