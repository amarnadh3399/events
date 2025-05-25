export const loadEvents = () => {
    const savedEvents = localStorage.getItem('events');
    if (!savedEvents) return [];
    
    return JSON.parse(savedEvents, (key, value) => {
      if (key === 'start' || key === 'end') return new Date(value);
      return value;
    });
  };
  
  export const saveEvents = (events) => {
    localStorage.setItem('events', JSON.stringify(events));
  };