import { useEffect, useState } from 'react';
import { crearDocumento, fetchMisDocumentos } from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

const TIPOS = [
  { value: 'DNI', label: 'DNI' },
  { value: 'TITULO_SEC', label: 'Título Secundario' },
  { value: 'CERT_MED', label: 'Certificado Médico' },
  { value: 'OTRO', label: 'Otro' },
];

export default function MisDocumentos() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('DNI');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  function cargar() {
    fetchMisDocumentos()
      .then((data) => setDocumentos(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!archivo) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un archivo.' });
      return;
    }

    setEnviando(true);
    setMensaje(null);
    try {
      await crearDocumento(tipo, archivo);
      setMensaje({ tipo: 'success', texto: 'Documento subido correctamente.' });
      setArchivo(null);
      cargar();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al subir documento.',
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
        <h2>📄 Subir Documento</h2>
        {mensaje && (
          <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de documento</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Archivo (PDF, JPG, PNG)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setArchivo(e.target.files[0])}
              required
            />
          </div>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Subiendo...' : 'Subir documento'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>📋 Mis Documentos</h2>
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : documentos.length === 0 ? (
          <p className="empty">No has subido documentos todavía.</p>
        ) : (
          <TableWrapper>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha de subida</th>
                  <th>Estado</th>
                  <th>Motivo rechazo</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((d) => (
                  <tr key={d.id}>
                    <td>{d.tipo_display}</td>
                    <td>{new Date(d.fecha_subida).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${badgeClase(d.estado)}`}>
                        {d.estado_display}
                      </span>
                    </td>
                    <td>{d.motivo_rechazo || '—'}</td>
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
