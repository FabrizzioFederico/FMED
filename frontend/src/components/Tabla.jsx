import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Vacio } from './ui.jsx';

export default function Tabla({ columnas, datos, vacio = 'No hay datos.' }) {
  if (!datos || datos.length === 0) return <Vacio>{vacio}</Vacio>;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            {columnas.map((c) => (
              <TableCell key={c.key} align={c.align || 'left'}
                         sx={{ fontWeight: 600 }}>{c.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {datos.map((item, idx) => (
            <TableRow key={item.id ?? idx} hover>
              {columnas.map((c) => (
                <TableCell key={c.key} align={c.align || 'left'}>
                  {c.render ? c.render(item) : item[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
