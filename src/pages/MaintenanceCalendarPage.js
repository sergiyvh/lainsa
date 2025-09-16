// src/pages/MaintenanceCalendarPage.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';

// Локалізації для date-fns
import { es, uk, enUS } from 'date-fns/locale';
// Примітка: для каталонської мови може знадобитися окремий пакет `date-fns/locale/ca`

import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { getData } from '../services/storageService';
import { useI18n } from '../i18n/i18n'; // Імпортуємо i18n

// Налаштування локалізації для date-fns
const locales = {
  'es': es,
  'uk': uk,
  'en': enUS,
  'ca': es, // Використовуємо іспанську як запасний варіант для каталонської
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MaintenanceCalendarPage = () => {
  const { t, lang } = useI18n(); // Отримуємо функцію t() та поточну мову
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стани для управління календарем
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const data = await getData('maintenance_events') || [];
      
      const calendarEvents = data
        .filter(event => event.nextServiceDate)
        .map(event => ({
          title: `${event.equipmentName} - ${event.eventType}`,
          start: new Date(event.nextServiceDate),
          end: new Date(event.nextServiceDate),
          allDay: true,
          resource: event,
        }));
        
      setEvents(calendarEvents);
      setLoading(false);
    };
    loadEvents();
  }, []);
  
  const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), [setCurrentDate]);
  const handleView = useCallback((newView) => setCurrentView(newView), [setCurrentView]);
  
  // ✅ ВИПРАВЛЕННЯ: Повідомлення календаря тепер використовують функцію t()
  const messages = useMemo(() => ({
    allDay: 'Todo el día', // Це значення рідко використовується, можна залишити
    previous: t('calendar_previous'),
    next: t('calendar_next'),
    today: t('calendar_today'),
    month: t('calendar_month'),
    week: t('calendar_week'),
    day: t('calendar_day'),
    agenda: t('calendar_agenda'),
    date: t('labels_date'),
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: t('calendar_no_events'),
    showMore: total => `+ ${total} más`,
  }), [t]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 2, borderRadius: '12px', height: '80vh' }}>
      <Typography variant="h4" gutterBottom>
        {t('nav_maintenance_calendar')}
      </Typography>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100% - 50px)' }}
        culture={lang} // ✅ Передаємо поточну мову в календар
        date={currentDate}
        view={currentView}
        onNavigate={handleNavigate}
        onView={handleView}
        messages={messages} // ✅ Передаємо перекладені повідомлення
      />
    </Paper>
  );
};

export default MaintenanceCalendarPage;