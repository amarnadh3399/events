import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';

const EventModal = ({ event, date, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: date || new Date(),
    end: date || new Date(),
    recurrence: { type: 'none', interval: 1, days: [] },
    color: '#2196f3',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start: new Date(event.start),
        end: new Date(event.end),
        recurrence: event.recurrence || { type: 'none', interval: 1, days: [] },
        color: event.color || '#2196f3',
      });
    } else if (date) {
      const start = new Date(date);
      const end = new Date(date);
      start.setHours(12, 0, 0, 0);
      end.setHours(13, 0, 0, 0);

      setFormData((prev) => ({
        ...prev,
        start,
        end,
      }));
    }
  }, [event, date]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  const handleRecurrenceChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        type,
        days: type === 'weekly' ? [prev.start.getDay()] : [],
        interval: 1,
      },
    }));
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        days: prev.recurrence.days.includes(day)
          ? prev.recurrence.days.filter((d) => d !== day)
          : [...prev.recurrence.days, day],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.start || !formData.end) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Sanitize recurrence object
      const sanitizedRecurrence = {
        type: formData.recurrence.type || 'none',
        interval: formData.recurrence.interval > 0 ? formData.recurrence.interval : 1,
        days: Array.isArray(formData.recurrence.days) ? formData.recurrence.days : [],
      };

      const eventData = {
        title: formData.title,
        description: formData.description,
        start: formData.start.toISOString(),
        end: formData.end.toISOString(),
        color: formData.color,
        recurrence: sanitizedRecurrence,
      };

      console.log('Sending event data:', eventData);

      let response;
      if (event && event._id) {
        response = await axios.put(
          `http://localhost:5001/api/events/${event._id}`,
          eventData,
          getAuthHeaders()
        );
      } else {
        response = await axios.post(
          'http://localhost:5001/api/events',
          eventData,
          getAuthHeaders()
        );
      }

      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Save event error:', err);
      setError(err.response?.data?.message || 'Error saving event');
    }
  };

  const handleDelete = async () => {
    try {
      if (!event?._id) return;
      await axios.delete(
        `http://localhost:5001/api/events/${event._id}`,
        getAuthHeaders()
      );
      onClose();
    } catch (err) {
      console.error('Delete event error:', err);
      setError(err.response?.data?.message || 'Error deleting event');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{event ? 'Edit Event' : 'New Event'}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Title *
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </label>

            <label>
              Start Date & Time *
              <input
                type="datetime-local"
                value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({ ...formData, start: parseISO(e.target.value) })}
              />
            </label>

            <label>
              End Date & Time *
              <input
                type="datetime-local"
                value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({ ...formData, end: parseISO(e.target.value) })}
                min={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
              />
            </label>

            <label>
              Description
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </label>

            <div className="recurrence-section">
              <label>Recurrence</label>
              <select
                value={formData.recurrence.type}
                onChange={(e) => handleRecurrenceChange(e.target.value)}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              {formData.recurrence.type !== 'none' && (
                <div className="recurrence-options">
                  {formData.recurrence.type === 'daily' && (
                    <label>
                      Every{' '}
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrence.interval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrence: {
                              ...formData.recurrence,
                              interval: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />{' '}
                      day(s)
                    </label>
                  )}

                  {formData.recurrence.type === 'weekly' && (
                    <div className="weekdays">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <button
                          type="button"
                          key={day}
                          className={`day-toggle ${
                            formData.recurrence.days.includes(day) ? 'active' : ''
                          }`}
                          onClick={() => handleDayToggle(day)}
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.recurrence.type === 'monthly' && (
                    <label>
                      Repeat on day {formData.start.getDate()} of every month
                    </label>
                  )}
                </div>
              )}
            </div>

            <label>
              Event Color
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </label>
          </div>

          <div className="form-actions">
            {event && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {event ? 'Update' : 'Create'} Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
