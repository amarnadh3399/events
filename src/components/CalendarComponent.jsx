import React, { useState, useMemo } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  differenceInDays,
  parseISO,
  startOfDay
} from 'date-fns';

const ItemTypes = {
  EVENT: 'event'
};

const isEventOnDay = (event, day) => {
  let startDate = event.start instanceof Date ? event.start : parseISO(event.start);
  let endDate = event.end instanceof Date ? event.end : parseISO(event.end);

  return (
    isSameDay(day, startDate) ||
    (startDate <= day && endDate >= day)
  );
};

const DraggableEvent = ({ event, onSelectEvent }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: ItemTypes.EVENT,
    item: { id: event.id, start: event.start, end: event.end },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div
      ref={dragRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelectEvent?.(event);
      }}
      style={{
        backgroundColor: event.color || '#007bff',
        color: '#fff',
        borderRadius: 4,
        padding: '4px 8px',
        fontSize: 12,
        marginBottom: 4,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        pointerEvents: isDragging ? 'none' : 'auto',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      title={event.title}
    >
      {event.title}
    </div>
  );
};

const DroppableDay = ({ day, events, onDropEvent, isToday, isCurrentMonth, onSelectDate, onSelectEvent }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.EVENT,
    drop: (item) => {
      if (onDropEvent) onDropEvent(item, day);
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={dropRef}
      onClick={() => onSelectDate?.(day)}
      style={{
        border: '1px solid #ddd',
        minHeight: 80,
        backgroundColor: isOver ? '#f1f8e9' : isToday ? '#e1f5fe' : '#fff',
        color: isCurrentMonth ? '#000' : '#aaa',
        display: 'flex',
        flexDirection: 'column',
        padding: 6,
        boxSizing: 'border-box',
        borderRadius: 4,
        transition: 'background-color 0.2s ease'
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>{format(day, 'd')}</div>
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        {events.map(event => (
          <DraggableEvent key={event.id} event={event} onSelectEvent={onSelectEvent} />
        ))}
      </div>
    </div>
  );
};

const CalendarComponent = ({ currentDate, events, onDateChange, onSelectDate, onSelectEvent, onUpdateEvent }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return events;

    return events.filter(ev =>
      ev.title?.toLowerCase().includes(query) ||
      ev.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);
  const totalCells = 42;

  const emptyStart = Array(startOffset).fill(null);
  const emptyEnd = Array(totalCells - daysInMonth.length - startOffset).fill(null);
  const calendarDays = [...emptyStart, ...daysInMonth, ...emptyEnd];

  const getDateKey = date => format(date, 'yyyy-MM-dd');

  const eventsByDate = useMemo(() => {
    const map = {};
    calendarDays.forEach(day => {
      if (!day) return;
      const key = getDateKey(day);
      map[key] = filteredEvents.filter(ev => isEventOnDay(ev, day));
    });
    return map;
  }, [calendarDays, filteredEvents]);

  const handleDropEvent = (draggedItem, dropDay) => {
    if (!draggedItem || !dropDay) return;

    const draggedEvent = events.find(ev => ev.id === draggedItem.id);
    if (!draggedEvent) return;

    const originalStart = draggedEvent.start instanceof Date ? draggedEvent.start : parseISO(draggedEvent.start);
    const originalEnd = draggedEvent.end instanceof Date ? draggedEvent.end : parseISO(draggedEvent.end);

    // Normalize to start of day for accurate day diff calculation
    const originalStartDay = startOfDay(originalStart);
    const dropDayStart = startOfDay(dropDay);

    const dayDiff = differenceInDays(dropDayStart, originalStartDay);

    const newStart = new Date(originalStart);
    newStart.setDate(newStart.getDate() + dayDiff);

    const newEnd = new Date(originalEnd);
    newEnd.setDate(newEnd.getDate() + dayDiff);

    // Check for conflicts (excluding the dragged event itself)
    const hasConflict = events.some(ev => {
      if (ev.id === draggedEvent.id) return false;

      const evStart = ev.start instanceof Date ? ev.start : parseISO(ev.start);
      const evEnd = ev.end instanceof Date ? ev.end : parseISO(ev.end);

      // Overlapping condition
      return (newStart < evEnd && newEnd > evStart);
    });

    if (hasConflict) {
      alert('Event conflicts with an existing event on this day.');
      return;
    }

    const updatedEvent = {
      ...draggedEvent,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    };

    onUpdateEvent?.(updatedEvent);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => onDateChange(subMonths(currentDate, 1))}>&lt; Prev</button>
          <h2>{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={() => onDateChange(addMonths(currentDate, 1))}>Next &gt;</button>
        </div>

        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            style={{
              width: '100%',
              maxWidth: 400,
              padding: 8,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
            <div
              key={label}
              style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, paddingBottom: 4 }}
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} style={{ minHeight: 80 }} />;
            }

            const key = getDateKey(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayEvents = eventsByDate[key] || [];

            return (
              <DroppableDay
                key={key}
                day={day}
                events={dayEvents}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                onDropEvent={handleDropEvent}
                onSelectDate={onSelectDate}
                onSelectEvent={onSelectEvent}
              />
            );
          })}
        </div>
      </div>
    </DndProvider>
  );
};

export default CalendarComponent;
