import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

const EventForm = ({ event, date, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: date || new Date(),
    end: date || new Date(),
    recurrence: { type: 'none', interval: 1 },
    color: '#2196f3'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        recurrence: event.recurrence || { type: 'none', interval: 1 },
        color: event.color
      });
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...event,
      ...formData,
      start: new Date(formData.start),
      end: new Date(formData.end)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{event ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </label>

          <label>
            Description:
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </label>

        <label>
            Start:
            <input
                type="datetime-local"
                value={format(new Date(formData.start), 'yyyy-MM-dd\'T\'HH:mm')}
                onChange={(e) => setFormData({ ...formData, start: parseISO(e.target.value) })}
            />
        </label>

        <label>
            End:
            <input
                type="datetime-local"
                value={format(new Date(formData.end), 'yyyy-MM-dd\'T\'HH:mm')}
                onChange={(e) => setFormData({ ...formData, end: parseISO(e.target.value) })}
            />
        </label>

          <label>
            Recurrence:
            <select
              value={formData.recurrence.type}
              onChange={(e) => setFormData({
                ...formData,
                recurrence: { ...formData.recurrence, type: e.target.value }
              })}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          {formData.recurrence.type !== 'none' && (
            <label>
              Interval:
              <input
                type="number"
                min="1"
                value={formData.recurrence.interval}
                onChange={(e) => setFormData({
                  ...formData,
                  recurrence: { ...formData.recurrence, interval: parseInt(e.target.value) }
                })}
              />
            </label>
          )}

          <label>
            Color:
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </label>

          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
            {event && (
              <button type="button" onClick={() => onDelete(event.id)}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;