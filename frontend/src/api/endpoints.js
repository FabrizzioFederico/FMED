import client from './client.js';


export const login = (dni, password) =>
  client.post('/auth/login/', { dni, password }).then((r) => r.data);
export const fetchMe = () => client.get('/auth/me/').then((r) => r.data);

export const actualizarPerfil = (datos) =>
  client.patch('/auth/perfil/', datos).then((r) => r.data);


const lista = (r) => r.data.results || r.data;

export const fetchAlumnos = () => client.get('/usuarios/alumnos/').then(lista);

export const fetchUsuarios = (rol = '') =>
  client.get('/usuarios/', { params: rol ? { rol } : {} }).then(lista);
export const crearUsuario = (d) => client.post('/usuarios/', d).then((r) => r.data);
export const actualizarUsuario = (id, d) =>
  client.put(`/usuarios/${id}/`, d).then((r) => r.data);
export const eliminarUsuario = (id) => client.delete(`/usuarios/${id}/`);


export const fetchPlanes = () => client.get('/planes/').then(lista);
export const crearPlan = (d) => client.post('/planes/', d).then((r) => r.data);
export const actualizarPlan = (id, d) => client.put(`/planes/${id}/`, d).then((r) => r.data);
export const eliminarPlan = (id) => client.delete(`/planes/${id}/`);


export const fetchMaterias = () => client.get('/materias/').then(lista);
export const crearMateria = (d) => client.post('/materias/', d).then((r) => r.data);
export const actualizarMateria = (id, d) => client.put(`/materias/${id}/`, d).then((r) => r.data);
export const eliminarMateria = (id) => client.delete(`/materias/${id}/`);


export const fetchPeriodos = () => client.get('/periodos/').then(lista);
export const crearPeriodo = (d) => client.post('/periodos/', d).then((r) => r.data);
export const actualizarPeriodo = (id, d) => client.put(`/periodos/${id}/`, d).then((r) => r.data);
export const eliminarPeriodo = (id) => client.delete(`/periodos/${id}/`);


export const fetchAulas = () => client.get('/aulas/').then(lista);
export const crearAula = (d) => client.post('/aulas/', d).then((r) => r.data);
export const actualizarAula = (id, d) => client.put(`/aulas/${id}/`, d).then((r) => r.data);
export const eliminarAula = (id) => client.delete(`/aulas/${id}/`);


export const fetchComisiones = () => client.get('/comisiones/').then(lista);
export const crearComision = (d) => client.post('/comisiones/', d).then((r) => r.data);
export const actualizarComision = (id, d) => client.put(`/comisiones/${id}/`, d).then((r) => r.data);
export const eliminarComision = (id) => client.delete(`/comisiones/${id}/`);


export const fetchMesasExamen = () => client.get('/mesas-examen/').then(lista);
export const crearMesaExamen = (d) => client.post('/mesas-examen/', d).then((r) => r.data);
export const actualizarMesaExamen = (id, d) => client.put(`/mesas-examen/${id}/`, d).then((r) => r.data);
export const eliminarMesaExamen = (id) => client.delete(`/mesas-examen/${id}/`);


export const inscribirAFinal = (mesaId) =>
  client.post('/inscripciones/final/', { mesa: mesaId }).then((r) => r.data);
export const inscribirACursada = (comisionId) =>
  client.post('/inscripciones/cursada/', { comision: comisionId }).then((r) => r.data);
export const fetchMisInscripciones = () =>
  client.get('/inscripciones/mis/').then((r) => r.data);

export const fetchMisCalificaciones = () =>
  client.get('/mis-calificaciones/').then((r) => r.data);
export const fetchMisAsistencias = () =>
  client.get('/mis-asistencias/').then((r) => r.data);

export const fetchActas = () => client.get('/actas/').then(lista);
export const crearActa = (d) => client.post('/actas/', d).then((r) => r.data);
export const cargarNota = (actaId, alumnoId, nota, observaciones = '') =>
  client.post(`/actas/${actaId}/cargar-nota/`, { alumno: alumnoId, nota, observaciones })
    .then((r) => r.data);
export const cerrarActa = (actaId) =>
  client.post(`/actas/${actaId}/cerrar/`).then((r) => r.data);


export const fetchAsistencias = () => client.get('/asistencias/').then(lista);
export const registrarAsistencia = (d) =>
  client.post('/asistencias/', d).then((r) => r.data);


export const fetchMisTramites = () => client.get('/tramites/').then(lista);
export const crearTramite = (d) => client.post('/tramites/', d).then((r) => r.data);
export const fetchTramitesPendientes = () =>
  client.get('/tramites/pendientes/').then((r) => r.data);
export const resolverTramite = (id, aprobado, motivo = '') =>
  client.post(`/tramites/${id}/resolver/`, { aprobado, motivo }).then((r) => r.data);


export const descargarCertificado = (id) =>
  client.get(`/tramites/${id}/certificado/`, { responseType: 'blob' })
    .then((r) => r.data);


export const fetchDocumentos = () => client.get('/documentos/').then(lista);
export const fetchDocumentosPendientes = () =>
  client.get('/documentos/pendientes/').then((r) => r.data);
export const validarDocumento = (id, aprobar, motivo = '') =>
  client.post(`/documentos/${id}/validar/`, { aprobar, motivo }).then((r) => r.data);
export const subirDocumento = (formData) =>
  client.post('/documentos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);


export const fetchInstituciones = () => client.get('/instituciones/').then(lista);
export const crearInstitucion = (d) => client.post('/instituciones/', d).then((r) => r.data);
export const actualizarInstitucion = (id, d) => client.put(`/instituciones/${id}/`, d).then((r) => r.data);
export const eliminarInstitucion = (id) => client.delete(`/instituciones/${id}/`);

export const fetchOfertas = () => client.get('/ofertas/').then(lista);
export const crearOferta = (d) => client.post('/ofertas/', d).then((r) => r.data);
export const actualizarOferta = (id, d) => client.put(`/ofertas/${id}/`, d).then((r) => r.data);
export const eliminarOferta = (id) => client.delete(`/ofertas/${id}/`);

export const fetchPostulaciones = () => client.get('/postulaciones/').then(lista);
export const postularse = (ofertaId, mensaje = '') =>
  client.post('/postulaciones/', { oferta: ofertaId, mensaje }).then((r) => r.data);
