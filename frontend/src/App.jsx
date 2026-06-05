import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Bolsa from './pages/Bolsa.jsx';
import MiPerfil from './pages/MiPerfil.jsx';


import MisInscripciones from './pages/alumno/MisInscripciones.jsx';
import MesasExamen from './pages/alumno/MesasExamen.jsx';
import InscripcionCursadas from './pages/alumno/InscripcionCursadas.jsx';
import MisCalificaciones from './pages/alumno/MisCalificaciones.jsx';
import MisAsistencias from './pages/alumno/MisAsistencias.jsx';
import Tramites from './pages/alumno/Tramites.jsx';
import MisDocumentos from './pages/alumno/MisDocumentos.jsx';
import MisPostulaciones from './pages/alumno/MisPostulaciones.jsx';


import MisComisiones from './pages/profesor/MisComisiones.jsx';
import TomarAsistencia from './pages/profesor/TomarAsistencia.jsx';
import Actas from './pages/profesor/Actas.jsx';


import Usuarios from './pages/admin/Usuarios.jsx';
import Planes from './pages/admin/Planes.jsx';
import Materias from './pages/admin/Materias.jsx';
import Periodos from './pages/admin/Periodos.jsx';
import Aulas from './pages/admin/Aulas.jsx';
import Comisiones from './pages/admin/Comisiones.jsx';
import Mesas from './pages/admin/Mesas.jsx';
import TramitesPendientes from './pages/admin/TramitesPendientes.jsx';
import DocumentosPendientes from './pages/admin/DocumentosPendientes.jsx';
import Instituciones from './pages/admin/Instituciones.jsx';
import Ofertas from './pages/admin/Ofertas.jsx';


const A = ['ALUMNO'];
const P = ['PROFESOR'];
const ADM = ['ADMINISTRATIVO'];

function R({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Inicio />} />

        {/* ---- Alumno ---- */}
        <Route path="inscripcion-cursadas" element={<R roles={A}><InscripcionCursadas /></R>} />
        <Route path="mesas-examen" element={<R roles={A}><MesasExamen /></R>} />
        <Route path="mis-inscripciones" element={<R roles={A}><MisInscripciones /></R>} />
        <Route path="mis-calificaciones" element={<R roles={A}><MisCalificaciones /></R>} />
        <Route path="mis-asistencias" element={<R roles={A}><MisAsistencias /></R>} />
        <Route path="tramites" element={<R roles={A}><Tramites /></R>} />
        <Route path="mis-documentos" element={<R roles={A}><MisDocumentos /></R>} />
        <Route path="mis-postulaciones" element={<R roles={A}><MisPostulaciones /></R>} />

        {/* ---- Profesor ---- */}
        <Route path="mis-comisiones" element={<R roles={P}><MisComisiones /></R>} />
        <Route path="asistencias" element={<R roles={P}><TomarAsistencia /></R>} />
        <Route path="actas" element={<R roles={P}><Actas /></R>} />

        {/* ---- Administrativo ---- */}
        <Route path="admin/usuarios" element={<R roles={ADM}><Usuarios /></R>} />
        <Route path="admin/planes" element={<R roles={ADM}><Planes /></R>} />
        <Route path="admin/materias" element={<R roles={ADM}><Materias /></R>} />
        <Route path="admin/periodos" element={<R roles={ADM}><Periodos /></R>} />
        <Route path="admin/aulas" element={<R roles={ADM}><Aulas /></R>} />
        <Route path="admin/comisiones" element={<R roles={ADM}><Comisiones /></R>} />
        <Route path="admin/mesas" element={<R roles={ADM}><Mesas /></R>} />
        <Route path="tramites-pendientes" element={<R roles={ADM}><TramitesPendientes /></R>} />
        <Route path="documentos-pendientes" element={<R roles={ADM}><DocumentosPendientes /></R>} />
        <Route path="admin/instituciones" element={<R roles={ADM}><Instituciones /></R>} />
        <Route path="admin/ofertas" element={<R roles={ADM}><Ofertas /></R>} />

        {/* ---- Compartida ---- */}
        <Route path="bolsa" element={<Bolsa />} />
        <Route path="mi-perfil" element={<R roles={['ALUMNO', 'PROFESOR']}><MiPerfil /></R>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
