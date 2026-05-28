import { useEffect, useState } from 'react';
import {
  cargarNota, cerrarActa, crearActa, fetchActas,
} from '../api/endpoints.js';
import TableWrapper from '../components/TableWrapper.jsx';

export default function Actas() {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [actaSeleccionada, setActaSeleccionada] = useState(null);
  const [alumnoId, setAlumnoId] = useState('');
  const [nota, setNota] = useState('');

  function cargar() {
    setLoading(true);
    fetchActas()
      .then((data) => setActas(data.results || data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleCrearActa() {
    setMensaje(null);
    try {
      await crearActa({ tipo: 'FINAL' });
      setMensaje({ tipo: 'success', texto: 'Acta creada (provisoria).' });
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'Error.' });
    }
  }

  async function handleCargarNota(e) {
    e.preventDefault();
    if (!actaSeleccionada) return;
    setMensaje(null);
    try {
      await cargarNota(actaSeleccionada, parseInt(alumnoId), parseFloat(nota));
      setMensaje({ tipo: 'success', texto: 'Nota cargada.' });
      setAlumnoId('');
      setNota('');
      cargar();
    } catch (err) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al cargar nota.',
      });
    }
  }

  async function handleCerrar(actaId) {
    if (!confirm('¿Cerrar acta? Una vez cerrada no se puede modificar.')) return;
    setMensaje(null);
    try {
      await cerrarActa(actaId);
      setMensaje({ tipo: 'success', texto: 'Acta cerrada y firmada digitalmente.' });
      cargar();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'Error.' });
    }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <>
      <div className="card">
        <h2>📑 Actas</h2>
        {mensaje && (
          <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>
        )}
        <button onClick={handleCrearActa}>+ Nueva acta de final</button>
      </div>

      {actas.map((acta) => (
        <div key={acta.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>
              Acta #{acta.id} - {acta.tipo_display}{' '}
              <span className={`badge ${acta.estado === 'CERRADA' ? 'badge-error' : 'badge-warning'}`}>
                {acta.estado_display}
              </span>
            </h2>
            {acta.estado === 'PROVISORIA' && (
              <button className="danger" onClick={() => handleCerrar(acta.id)}>
                Cerrar acta
              </button>
            )}
          </div>

          {acta.firma_digital && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
              🔒 Firma: <code>{acta.firma_digital.slice(0, 32)}...</code>
            </p>
          )}

          {/* Formulario para cargar nota provisoria */}
          {acta.estado === 'PROVISORIA' && (
            <form onSubmit={handleCargarNota} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem' }}>ID Alumno</label>
                <input
                  type="number"
                  placeholder="Ej: 4"
                  value={actaSeleccionada === acta.id ? alumnoId : ''}
                  onChange={(e) => {
                    setActaSeleccionada(acta.id);
                    setAlumnoId(e.target.value);
                  }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem' }}>Nota (0 a 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="Ej: 7"
                  value={actaSeleccionada === acta.id ? nota : ''}
                  onChange={(e) => {
                    setActaSeleccionada(acta.id);
                    setNota(e.target.value);
                  }}
                  required
                />
              </div>
              <button type="submit">Cargar nota</button>
            </form>
          )}

          {/* Lista de calificaciones ya cargadas */}
          {acta.calificaciones?.length > 0 && (
            <TableWrapper>
              <table style={{ marginTop: '1rem' }}>
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {acta.calificaciones.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nombre_alumno} ({c.alumno_username})</td>
                      <td><strong>{c.nota}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </div>
      ))}
    </>
  );
}
