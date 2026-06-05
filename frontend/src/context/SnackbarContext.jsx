import { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [estado, setEstado] = useState({
    open: false, mensaje: '', severity: 'info',
  });

  const show = useCallback((mensaje, severity = 'info') => {
    setEstado({ open: true, mensaje, severity });
  }, []);

  const cerrar = (_, motivo) => {
    if (motivo === 'clickaway') return;
    setEstado((s) => ({ ...s, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <Snackbar
        open={estado.open}
        autoHideDuration={4000}
        onClose={cerrar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={cerrar} severity={estado.severity}
               variant="filled" sx={{ width: '100%' }}>
          {estado.mensaje}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}
