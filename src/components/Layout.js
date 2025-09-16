// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Box, CssBaseline, Button,
  FormControl, InputLabel, Select, MenuItem, Collapse
} from '@mui/material';
import Clock from './Clock';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArchiveIcon from '@mui/icons-material/Archive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import HandymanIcon from '@mui/icons-material/Handyman';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { useI18n } from '../i18n/i18n';
import { getData } from '../services/storageService';
import useHasSettingsAccess from '../hooks/useHasSettingsAccess';

const LainsaLogo = `${process.env.PUBLIC_URL}/logo512.png`;
const DevLogo = `${process.env.PUBLIC_URL}/svh_logo.png`;
const drawerWidth = 240;
const appBarColor = '#004A8F';

// ВИСОТА футера для резерву в контенті
const FOOTER_H = 84;

export default function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, setLang } = useI18n();

  const [isShiftActive, setIsShiftActive] = useState(false);
  const { canAccess: canOpenSettings } = useHasSettingsAccess(user);

  // Розкривні групи меню
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [maintenanceMenuOpen, setMaintenanceMenuOpen] = useState(false);
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(location.pathname.startsWith('/archive/'));
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // показувати Drawer тільки якщо це не auth-сторінка і користувач увійшов
  const AUTH_PREFIXES = ['/login', '/register', '/signup', '/new-user', '/auth', '/reset-password'];
  const isAuthRoute = AUTH_PREFIXES.some(p => location.pathname.startsWith(p));
  const showDrawer = !!user && !isAuthRoute;

  useEffect(() => {
    const checkShiftStatus = async () => {
      const shift = await getData('current_shift');
      setIsShiftActive(!!shift);
    };
    checkShiftStatus();
    const interval = setInterval(checkShiftStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Хелпер для нормальних підписів навіть якщо ключів поки немає
  const tt = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  // Головні пункти меню (БЕЗ "Архів", бо тепер це розкривна група нижче)
  const mainMenuItems = [
    { text: t('nav_panel'), icon: <DashboardIcon />, path: '/dashboard' },
    isShiftActive && { text: t('nav_machines'), icon: <LocalLaundryServiceIcon />, path: '/machines' },
    { text: t('nav_reports'), icon: <AssessmentIcon />, path: '/reports' },
    { text: t('nav_analytics'), icon: <BarChartIcon />, path: '/analytics' },
  ].filter(Boolean);

  const staffSubMenuItems = [
    { text: t('nav_staff_directory'), icon: <PeopleIcon />, path: '/staff' },
    { text: t('nav_staff_roster'), icon: <CalendarMonthIcon />, path: '/staff-roster' },
  ];

  const maintenanceSubMenuItems = [
    { text: t('nav_tech_report'), icon: <AssignmentTurnedInRoundedIcon />, path: '/technician-report' },
    { text: t('nav_equipment'), icon: <HandymanIcon />, path: '/equipment' },
    { text: t('nav_maintenance_log'), icon: <EngineeringIcon />, path: '/maintenance' },
    { text: t('nav_maintenance_calendar'), icon: <CalendarMonthIcon />, path: '/maintenance-calendar' },
  ];

  // Підпункти "Архів"
  const archiveSubMenuItems = [
    { text: tt('menu.archiveOperator', 'Звіти оператора'),  icon: <SummarizeIcon />,           path: '/archive/operator' },
    { text: tt('menu.archiveTechnician', 'Звіти техніка'),  icon: <BuildCircleIcon />,         path: '/archive/technician' },
    { text: tt('menu.archiveIncidents', 'Інциденти'),       icon: <ReportGmailerrorredIcon />, path: '/archive/incidents' },
    { text: tt('menu.archiveMisc', 'Інше'),                 icon: <MoreHorizIcon />,           path: '/archive/misc' },
  ];

  const adminSubMenuItems = [
    canOpenSettings && { text: t('nav_settings'), icon: <SettingsIcon />, path: '/settings' },
    user?.role === 'admin' && { text: t('nav_users'), icon: <PeopleIcon />, path: '/users-admin' },
    { text: t('nav_about'), icon: <InfoIcon />, path: '/about' },
  ].filter(Boolean);

  const currentYear = new Date().getFullYear();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: appBarColor }}
        className="no-print"
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
            <Link to={user ? '/dashboard' : '/login'} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src={LainsaLogo} alt="Lainsa Logo" style={{ height: '40px' }} />
              <Typography variant="h5" component="span" sx={{ color: 'white', fontWeight: 'bold', ml: 1.5 }}>
                {t('brand')}
              </Typography>
            </Link>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Clock />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="lang-select-label" sx={{ color: 'white' }}>
                {tt('settings_lang_title', 'Мова застосунку')}
              </InputLabel>
              <Select
                labelId="lang-select-label"
                label={tt('settings_lang_title', 'Мова застосунку')}
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="es">{tt('lang_es', 'Español')}</MenuItem>
                <MenuItem value="uk">{tt('lang_uk', 'Українська')}</MenuItem>
                <MenuItem value="ca">{tt('lang_ca', 'Català')}</MenuItem>
                <MenuItem value="en">{tt('lang_en', 'English')}</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ minWidth: '150px', textAlign: 'right' }}>
              {user ? (
                <>
                  <Typography component="span" sx={{ mr: 2, display: { xs: 'none', sm: 'inline' }, color: 'white' }}>
                    {t('hello_name', { name: user.username })}
                  </Typography>
                  <Button color="inherit" onClick={handleLogout}>{t('nav_logout')}</Button>
                </>
              ) : (
                <Button color="inherit" onClick={() => navigate('/login')}>{t('login')}</Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Drawer */}
      {showDrawer && (
        <Drawer
          variant="permanent"
          sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          className="no-print"
        >
          <Toolbar />
          {/* Невеликий додатковий відступ знизу, але не обов'язковий тепер */}
          <Box sx={{ overflow: 'auto', paddingBottom: '24px' }}>
            <List>
              {/* Головні пункти */}
              {mainMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}

              {/* Група АРХІВ */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => setArchiveMenuOpen((o) => !o)}>
                  <ListItemIcon><ArchiveIcon /></ListItemIcon>
                  <ListItemText primary={t('nav_archive')} />
                  {archiveMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={archiveMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {archiveSubMenuItems.map((item) => (
                    <ListItemButton
                      key={item.path}
                      component={Link}
                      to={item.path}
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>

              {/* Кадри (Staff) */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => setStaffMenuOpen((o) => !o)}>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary={t('nav_staff')} />
                  {staffMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={staffMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {staffSubMenuItems.map((item) => (
                    <ListItemButton
                      key={item.path}
                      component={Link}
                      to={item.path}
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>

              {/* Технічний блок */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => setMaintenanceMenuOpen((o) => !o)}>
                  <ListItemIcon><HandymanIcon /></ListItemIcon>
                  <ListItemText primary={tt('nav_maintenance', 'Технічне обслуговування')} />
                  {maintenanceMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={maintenanceMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {maintenanceSubMenuItems.map((item) => (
                    <ListItemButton
                      key={item.path}
                      component={Link}
                      to={item.path}
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>

              {/* Адмін-блок */}
              <ListItem disablePadding>
                <ListItemButton onClick={() => setAdminMenuOpen((o) => !o)}>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary={tt('nav_admin', 'Адмін')} />
                  {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {adminSubMenuItems.map((item) => (
                    <ListItemButton
                      key={item.text}
                      component={Link}
                      to={item.path}
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </List>
          </Box>
        </Drawer>
      )}

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          // ГОЛОВНЕ: запас під fixed-футер, щоб низ сторінки завжди був видимий
          pb: `${FOOTER_H + 16}px`,
        }}
      >
        {/* компенсуємо AppBar */}
        <Toolbar />
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        className="no-print"
        sx={{
          position: 'fixed',
          left: showDrawer ? drawerWidth : 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          // Робимо висоту прогнозованою під резерв у main
          height: `${FOOTER_H}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          SVH Group UA
          <img src={DevLogo} alt="SVH Group Logo" style={{ height: '16px', verticalAlign: 'middle' }} />
          para LAVANDERIA INSULAR SL (LAINSA)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('brand')} &copy; 1970 - {currentYear}
        </Typography>
      </Box>
    </Box>
  );
}
