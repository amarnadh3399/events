export const isEventOnDay = (event, day) => {
    if (!event || !day) return false;
    
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const currentDay = new Date(day);
  
    if (currentDay < eventStart || currentDay > eventEnd) return false;
  
    if (!event.recurrence || event.recurrence.type === 'none') {
      return isSameDay(eventStart, currentDay);
    }
  
    const dayDifference = differenceInDays(currentDay, eventStart);
    
    switch (event.recurrence.type) {
      case 'daily':
        return dayDifference % event.recurrence.interval === 0;
        
      case 'weekly':
        const weeksDifference = Math.floor(dayDifference / 7);
        return weeksDifference % event.recurrence.interval === 0 &&
               event.recurrence.days.includes(currentDay.getDay());
        
      case 'monthly':
        return eventStart.getDate() === currentDay.getDate();
        
      case 'custom':
        return dayDifference % (event.recurrence.interval * 7) === 0;
        
      default:
        return false;
    }
  };
  
  export const checkEventConflict = (existingEvents, newEvent) => {
    return existingEvents.filter(event => 
      (newEvent.start < event.end && newEvent.end > event.start) ||
      (event.start < newEvent.end && event.end > newEvent.start)
    );
  };