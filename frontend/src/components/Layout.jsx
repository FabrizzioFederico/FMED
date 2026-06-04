import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';


import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import WorkIcon from '@mui/icons-material/Work';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import InboxIcon from '@mui/icons-material/Inbox';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BusinessIcon from '@mui/icons-material/Business';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import { useAuth } from '../context/AuthContext.jsx';

const ANCHO_DRAWER = 260;


const MENUS = {
  ALUMNO: [
    { seccion: 'General' },
    { to: '/', label: 'Inicio', icon: <HomeIcon />, exact: true },
    { seccion: 'Cursada' },
    { to: '/inscripcion-cursadas', label: 'Inscribirme a Cursada', icon: <SchoolIcon /> },
    { to: '/mesas-examen', label: 'Inscribirme a Final', icon: <EventNoteIcon /> },
    { to: '/mis-inscripciones', label: 'Mis Inscripciones', icon: <AssignmentIcon /> },
    { seccion: 'Académico' },
    { to: '/mis-calificaciones', label: 'Mis Notas', icon: <GradeIcon /> },
    { to: '/mis-asistencias', label: 'Mis Asistencias', icon: <ChecklistIcon /> },
    { seccion: 'Gestiones' },
    { to: '/tramites', label: 'Trámites', icon: <DescriptionIcon /> },
    { to: '/mis-documentos', label: 'Mis Documentos', icon: <FolderIcon /> },
    { to: '/bolsa', label: 'Bolsa de Trabajo', icon: <WorkIcon /> },
    { to: '/mis-postulaciones', label: 'Mis Postulaciones', icon: <SendIcon /> },
    { seccion: 'Cuenta' },
    { to: '/mi-perfil', label: 'Mi Perfil', icon: <PersonIcon /> },
  ],
  PROFESOR: [
    { seccion: 'General' },
    { to: '/', label: 'Inicio', icon: <HomeIcon />, exact: true },
    { seccion: 'Docencia' },
    { to: '/mis-comisiones', label: 'Mis Comisiones', icon: <GroupsIcon /> },
    { to: '/asistencias', label: 'Tomar Asistencia', icon: <ChecklistIcon /> },
    { to: '/actas', label: 'Actas y Notas', icon: <GradeIcon /> },
    { seccion: 'Otros' },
    { to: '/bolsa', label: 'Bolsa de Trabajo', icon: <WorkIcon /> },
    { seccion: 'Cuenta' },
    { to: '/mi-perfil', label: 'Mi Perfil', icon: <PersonIcon /> },
  ],
  ADMINISTRATIVO: [
    { seccion: 'General' },
    { to: '/', label: 'Inicio', icon: <HomeIcon />, exact: true },
    { seccion: 'Usuarios' },
    { to: '/admin/usuarios', label: 'Gestión de Usuarios', icon: <GroupIcon /> },
    { seccion: 'Plan de Estudios' },
    { to: '/admin/planes', label: 'Planes de Estudio', icon: <MenuBookIcon /> },
    { to: '/admin/materias', label: 'Materias', icon: <LibraryBooksIcon /> },
    { seccion: 'Cursada' },
    { to: '/admin/periodos', label: 'Períodos Lectivos', icon: <CalendarMonthIcon /> },
    { to: '/admin/aulas', label: 'Aulas', icon: <MeetingRoomIcon /> },
    { to: '/admin/comisiones', label: 'Comisiones', icon: <GroupsIcon /> },
    { to: '/admin/mesas', label: 'Mesas de Examen', icon: <EventIcon /> },
    { seccion: 'Gestión' },
    { to: '/tramites-pendientes', label: 'Trámites Pendientes', icon: <InboxIcon /> },
    { to: '/documentos-pendientes', label: 'Documentos Pendientes', icon: <FactCheckIcon /> },
    { seccion: 'Bolsa de Trabajo' },
    { to: '/admin/instituciones', label: 'Instituciones', icon: <BusinessIcon /> },
    { to: '/admin/ofertas', label: 'Ofertas', icon: <LocalOfferIcon /> },
    { to: '/bolsa', label: 'Ver Bolsa', icon: <WorkIcon /> },
  ],
};


export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const esMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = MENUS[user?.rol] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }


  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box
          component="img"
          src="/images/logo.png"
          alt="Logo Facultad de Medicina"
          sx={{height: 40, objectFit: 'contain' }}
        />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Intranet
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Facultad de Medicina
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
        {menu.map((item, i) =>
          item.seccion ? (
            <ListSubheader key={`s${i}`}
              sx={{ bgcolor: 'transparent', fontSize: '0.7rem', lineHeight: 2.2 }}>
              {item.seccion}
            </ListSubheader>
          ) : (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.exact}
                onClick={() => esMobile && setMobileOpen(false)}
                sx={{
                  '&.active': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.92rem' }} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {(user?.nombre_completo || '?').charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {user?.nombre_completo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.rol_display}
          </Typography>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton onClick={handleLogout} size="small">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${ANCHO_DRAWER}px)` },
          ml: { md: `${ANCHO_DRAWER}px` },
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { md: 'none' } }}
            onClick={() => setMobileOpen((v) => !v)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Intranet Facultad de Medicina
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer: temporal en mobile, permanente en desktop */}
      <Box component="nav" sx={{ width: { md: ANCHO_DRAWER }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: ANCHO_DRAWER, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: ANCHO_DRAWER, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main"
        sx={{
          flexGrow: 1, p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${ANCHO_DRAWER}px)` },
          minWidth: 0,
        }}
      >
        <Toolbar /> {}
        <Outlet />
      </Box>
    </Box>
  );
}
