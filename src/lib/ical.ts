import { Todo, RecurrenceRule } from './types';

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold long ICS content lines per RFC 5545 (75 octets). */
function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  let result = line.slice(0, max);
  let rest = line.slice(max);
  while (rest.length > 0) {
    result += `\r\n ${rest.slice(0, max - 1)}`;
    rest = rest.slice(max - 1);
  }
  return result;
}

function formatDateOnly(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

function formatDateTimeLocal(isoDate: string, startTime: string): string {
  const [h = '00', m = '00'] = startTime.split(':');
  return `${formatDateOnly(isoDate)}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

function addMinutesToTime(isoDate: string, startTime: string, minutes: number): string {
  const [h = 0, m = 0] = startTime.split(':').map(Number);
  const d = new Date(
    Number(isoDate.slice(0, 4)),
    Number(isoDate.slice(5, 7)) - 1,
    Number(isoDate.slice(8, 10)),
    h,
    m,
    0
  );
  d.setMinutes(d.getMinutes() + minutes);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${mi}00`;
}

function recurrenceToRrule(rule: RecurrenceRule): string | null {
  const interval = rule.interval && rule.interval > 1 ? `;INTERVAL=${rule.interval}` : '';
  switch (rule.frequency) {
    case 'daily':
      return `FREQ=DAILY${interval}`;
    case 'weekdays':
      return `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`;
    case 'weekly':
      return `FREQ=WEEKLY${interval}`;
    case 'monthly':
      return `FREQ=MONTHLY${interval}`;
    default:
      return null;
  }
}

function todoToVevent(todo: Todo): string | null {
  if (!todo.dueDate || todo.completed) return null;

  const lines: string[] = ['BEGIN:VEVENT'];
  lines.push(`UID:${todo.id}@lumen`);
  lines.push(`DTSTAMP:${formatDateOnly(todo.updatedAt.slice(0, 10))}T000000Z`);
  lines.push(`SUMMARY:${escapeIcsText(todo.title)}`);

  const descParts: string[] = [];
  if (todo.notes?.trim()) descParts.push(todo.notes.trim());
  if (todo.tags && todo.tags.length > 0) {
    descParts.push(`Tags: ${todo.tags.map((t) => `#${t}`).join(' ')}`);
  }
  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join('\\n'))}`);
  }

  if (todo.startTime) {
    const duration = todo.durationMinutes && todo.durationMinutes > 0 ? todo.durationMinutes : 30;
    lines.push(`DTSTART:${formatDateTimeLocal(todo.dueDate, todo.startTime)}`);
    lines.push(`DTEND:${addMinutesToTime(todo.dueDate, todo.startTime, duration)}`);
  } else {
    // All-day event
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(todo.dueDate)}`);
    const end = addMinutesToTime(todo.dueDate, '00:00', 24 * 60);
    lines.push(`DTEND;VALUE=DATE:${end.slice(0, 8)}`);
  }

  if (todo.recurrence) {
    const rrule = recurrenceToRrule(todo.recurrence);
    if (rrule) lines.push(`RRULE:${rrule}`);
  }

  if (todo.priority === 'high') lines.push('PRIORITY:1');
  else if (todo.priority === 'medium') lines.push('PRIORITY:5');
  else if (todo.priority === 'low') lines.push('PRIORITY:9');

  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

export function todosToIcs(todos: Todo[]): string {
  const events = todos
    .map(todoToVevent)
    .filter((v): v is string => Boolean(v))
    .join('\r\n');

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumen//Personal Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lumen Tasks',
  ]
    .map(foldLine)
    .join('\r\n');

  return `${header}\r\n${events}\r\nEND:VCALENDAR\r\n`;
}

export function downloadIcs(filename: string, content: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
