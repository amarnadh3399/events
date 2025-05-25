import React, { useState, useMemo } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';
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
  parseISO
} from 'date-fns';

const isEventOnDay = (event, day) => {
  let startDate = event.start;
  let endDate = event.end;

  if (!(startDate instanceof Date)) {
    try {
      startDate = parseISO(startDate);
    } catch {
      return false;
    }
  }

  if (!(endDate instanceof Date)) {
    try {
      endDate = parseISO(endDate);
    } catch {
      return false;
    }
  }

  return isSameDay(day, startDate) || (startDate <= day && endDate >= day);
};

const CalendarComponent = ({
  currentDate,
  events,
  onDateChange,
  onSelectDate,
  onSelectEvent,
  onUpdateEvent
}) => {
  // Removed isDragging and localEvents state for simplicity
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;

    const lowerQuery = searchQuery.toLowerCase();
    return events.filter(ev =>
      (ev.title && ev.title.toLowerCase().includes(lowerQuery)) ||
      (ev.description && ev.description.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);
  const totalCells = 42;

  const emptyStart = Array(startWeekday).fill(null);
  const emptyEnd = Array(totalCells - daysInMonth.length - startWeekday).fill(null);
  const calendarDays = [...emptyStart, ...daysInMonth, ...emptyEnd];

  const getDateKey = (date) => format(date, 'yyyy-MM-dd');

  const eventsByDate = useMemo(() => {
    const map = {};
    calendarDays.forEach(day => {
      if (!day) return;
      const dateKey = getDateKey(day);
      map[dateKey] = filteredEvents.filter(ev => isEventOnDay(ev, day));
    });
    return map;
  }, [filteredEvents, calendarDays]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId &&
        source.index === destination.index) return;

    const event = events.find(ev => String(ev.id) === draggableId);
    if (!event) return;

    const sourceDate = parseISO(source.droppableId);
    const destinationDate = parseISO(destination.droppableId);
    const dayDiff = differenceInDays(destinationDate, sourceDate);
    if (dayDiff === 0) return;

    const newStart = new Date(event.start);
    newStart.setDate(newStart.getDate() + dayDiff);
    const newEnd = new Date(event.end);
    newEnd.setDate(newEnd.getDate() + dayDiff);

    const updatedEvent = {
      ...event,
      start: newStart.toISOString(),
      end: newEnd.toISOString()
    };

    if (onUpdateEvent) onUpdateEvent(updatedEvent);
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => onDateChange(subMonths(currentDate, 1))}>&lt; Prev</button>
        <h2 style={{ margin: 0 }}>{format(currentDate, 'MMMM yyyy')}</h2>
        <button onClick={() => onDateChange(addMonths(currentDate, 1))}>Next &gt;</button>
      </div>

      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search events by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 8,
            fontSize: 14,
            borderRadius: 4,
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            userSelect: 'none',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              style={{ textAlign: 'center', fontWeight: 'bold', padding: 6, borderBottom: '2px solid #ccc' }}
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{ border: '1px solid #f0f0f0', minHeight: 80, backgroundColor: '#fafafa' }}
                />
              );
            }

            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dateKey = getDateKey(day);
            const eventsForDay = eventsByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                style={{
                  border: '1px solid #ddd',
                  minHeight: 80,
                  backgroundColor: isToday ? '#e0f7fa' : 'white',
                  color: isCurrentMonth ? 'inherit' : '#bbb',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 4,
                  boxSizing: 'border-box',
                }}
                onClick={() => onSelectDate && onSelectDate(day)}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{format(day, 'd')}</div>

                <Droppable droppableId={dateKey} type="EVENTS">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ flexGrow: 1, overflowY: 'auto' }}
                    >
                      {eventsForDay.map((event, index) => (
                        <Draggable key={String(event.id)} draggableId={String(event.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={e => {
                                e.stopPropagation();
                                onSelectEvent && onSelectEvent(event);
                              }}
                              style={{
                                backgroundColor: event.color || '#007bff',
                                color: 'white',
                                borderRadius: 4,
                                padding: '2px 6px',
                                marginBottom: 4,
                                fontSize: 12,
                                boxShadow: snapshot.isDragging ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
                                userSelect: 'none',
                                ...provided.draggableProps.style
                              }}
                              title={event.title}
                            >
                              {event.title.length > 15 ? event.title.slice(0, 12) + '...' : event.title}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default CalendarComponent;
