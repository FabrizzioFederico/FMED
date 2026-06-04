import { Navigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './ui.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Cargando />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) {
    return <Alert severity="error" sx={{ m: 3 }}>
      No tenés permisos para ver esta sección.
    </Alert>;
  }
  return children;
}
