import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CalendarComponent from '../components/CalendarComponent';
import EventModal from '../components/EventModal';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to build consistent auth headers
  const getAuthHeaders = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  }), []);

  // Normalize event dates helper
  const normalizeEventDates = (ev) => ({
    ...ev,
    start: new Date(ev.start),
    end: ev.end ? new Date(ev.end) : new Date(ev.start),
    id: String(ev._id || ev.id || Date.now()), // fallback ID
  });

  // Fetch all events from backend API
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/events', getAuthHeaders());
      const eventsData = response.data.map(normalizeEventDates);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Logout user and redirect to login page
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  }, [navigate]);

  // Save or update event (POST or PUT)
  const handleEventUpdate = useCallback(async (eventData) => {
    try {
      const isoEventData = {
        ...eventData,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
      };

      const url = eventData.id
        ? `http://localhost:5001/api/events/${eventData.id}`
        : 'http://localhost:5001/api/events';
      const method = eventData.id ? 'put' : 'post';

      const response = await axios[method](url, isoEventData, getAuthHeaders());
      const updatedEvent = normalizeEventDates(response.data);

      setEvents((prevEvents) => {
        const idx = prevEvents.findIndex(ev => ev.id === updatedEvent.id);
        if (idx !== -1) {
          const updated = [...prevEvents];
          updated[idx] = updatedEvent;
          return updated;
        }
        return [...prevEvents, updatedEvent];
      });
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save the event. Please try again.');
    } finally {
      closeModal();
    }
  }, [getAuthHeaders]);

  // Delete event by ID
  const handleEventDelete = useCallback(async (eventId) => {
    try {
      await axios.delete(`http://localhost:5001/api/events/${eventId}`, getAuthHeaders());
      setEvents((prev) => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete the event. Please try again.');
    } finally {
      closeModal();
    }
  }, [getAuthHeaders]);

  // Update event after drag-and-drop interaction
  const handleEventDragUpdate = useCallback((updatedEvent) => {
    const startDate = updatedEvent.start instanceof Date
      ? updatedEvent.start
      : new Date(updatedEvent.start);
    const endDate = updatedEvent.end instanceof Date
      ? updatedEvent.end
      : new Date(updatedEvent.end);

    handleEventUpdate({ ...updatedEvent, start: startDate, end: endDate });
  }, [handleEventUpdate]);

  // Modal open handlers for date or event click
  const handleDateClick = useCallback((date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  }, []);

  // Close modal helper
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  }, []);

  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  return (
    <div className="calendar-page">
      <header
        className="calendar-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1>Event Calendar</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <CalendarComponent
        currentDate={currentDate}
        events={events}
        onDateChange={setCurrentDate}
        onUpdateEvent={handleEventDragUpdate}
        onSelectDate={handleDateClick}
        onSelectEvent={handleEventClick}
      />

      {isModalOpen && (
        <EventModal
          key={selectedEvent?.id || selectedDate?.toISOString()}
          event={selectedEvent}
          date={selectedDate}
          onSave={handleEventUpdate}
          onDelete={handleEventDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CalendarPage;
