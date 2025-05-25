import React, { useState, useEffect, useMemo } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to check if two dates are on the same day
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Check if event occurs on given day (assuming event has a startDate property)
const isEventOnDay = (event, day) => {
  const eventDate = new Date(event.startDate);
  return isSameDay(eventDate, day);
};

const Calendar = ({ events }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filtered events can be based on search or category if implemented
  // For now, just use all events
  const filteredEvents = events;

  // Calculate calendar days (array of Date objects or null for empty slots)
  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Determine first day of week index (0=Sunday, 1=Monday, etc)
    const startDayIndex = startOfMonth.getDay();

    const totalSlots = Math.ceil((startDayIndex + daysInMonth) / 7) * 7;
    const days = [];

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - startDayIndex + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        days.push(null); // Empty slot
      } else {
        days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber));
      }
    }

    return days;
  }, [currentMonth]);

  // Precompute events for each day to avoid hooks inside loops
  const eventsByDay = useMemo(() => {
    const map = {};
    calendarDays.forEach(day => {
      if (day) {
        const dayKey = day.toISOString().split('T')[0]; // yyyy-mm-dd format
        map[dayKey] = filteredEvents.filter(ev => isEventOnDay(ev, day));
      }
    });
    return map;
  }, [filteredEvents, calendarDays]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div>
      <div>
        <button onClick={goToPreviousMonth}>Previous</button>
        <span>{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <button onClick={goToNextMonth}>Next</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {/* Weekday Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(dayName => (
          <div key={dayName} style={{ fontWeight: "bold" }}>{dayName}</div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={{ backgroundColor: "#f0f0f0", minHeight: 80 }} />;
          }

          const dayKey = day.toISOString().split('T')[0];
          const eventsForDay = eventsByDay[dayKey] || [];

          return (
            <div key={dayKey} style={{ border: "1px solid #ddd", minHeight: 80, padding: 5 }}>
              <div><strong>{day.getDate()}</strong></div>
              <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
                {eventsForDay.map(event => (
                  <li key={event.id} style={{ fontSize: 12, marginTop: 2 }}>
                    {event.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
