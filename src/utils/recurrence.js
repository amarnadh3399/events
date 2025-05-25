import { isSameDay, differenceInDays, getDay, getDate } from 'date-fns';

export function isEventOnDay(event, day) {
  const { recurrence } = event;
  const eventStart = new Date(event.start);

  if (!recurrence || recurrence.type === 'none') {
    return isSameDay(eventStart, day);
  }

  if (day < eventStart) return false;
  if (recurrence.endDate && day > new Date(recurrence.endDate)) return false;

  switch (recurrence.type) {
    case 'daily': {
      const daysDiff = differenceInDays(day, eventStart);
      return daysDiff % recurrence.interval === 0;
    }
    case 'weekly': {
      // recurrence.days is array of weekdays (0=Sun,...)
      if (!recurrence.days || recurrence.days.length === 0) return false;
      const weekday = getDay(day);
      if (!recurrence.days.includes(weekday)) return false;

      // Check interval in weeks
      const daysDiff = differenceInDays(day, eventStart);
      const weeksDiff = Math.floor(daysDiff / 7);
      return weeksDiff % recurrence.interval === 0;
    }
    case 'monthly': {
      // Check day of month and interval of months
      if (getDate(day) !== getDate(eventStart)) return false;
      const monthsDiff = (day.getFullYear() - eventStart.getFullYear()) * 12 + (day.getMonth() - eventStart.getMonth());
      return monthsDiff % recurrence.interval === 0;
    }
    default:
      return false;
  }
}
