import { RecurrenceRule } from './types';

export function getTodayISO(): string {
  const d = new Date();
  return formatDateISO(d);
}

export function addDaysISO(days: number, fromISO?: string): string {
  const base = fromISO ? parseISODate(fromISO) : new Date();
  base.setDate(base.getDate() + days);
  return formatDateISO(base);
}

export function getTomorrowISO(): string {
  return addDaysISO(1);
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(iso1?: string | null, iso2?: string | null): boolean {
  if (!iso1 || !iso2) return false;
  return iso1 === iso2;
}

export function isOverdue(dueDate?: string | null, completed?: boolean): boolean {
  if (!dueDate || completed) return false;
  const today = getTodayISO();
  return dueDate < today;
}

export function formatFriendlyDate(isoDate?: string | null): string {
  if (!isoDate) return '';
  const today = getTodayISO();
  if (isoDate === today) return 'Today';

  const d = parseISODate(isoDate);
  const t = parseISODate(today);
  const diffTime = d.getTime() - t.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getUpcomingDays(
  count = 7
): Array<{ dateISO: string; label: string; dayName: string; isToday: boolean }> {
  const result = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateISO = formatDateISO(d);

    let label = '';
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else {
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    result.push({
      dateISO,
      label,
      dayName,
      isToday: i === 0,
    });
  }

  return result;
}

export function getWeekDays(): Array<{
  dateISO: string;
  dayName: string;
  dateNum: number;
  isToday: boolean;
}> {
  const today = new Date();
  const todayISO = formatDateISO(today);

  // Find Monday of current week
  const dayOfWeek = today.getDay(); // 0 is Sun
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMon);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateISO = formatDateISO(d);

    days.push({
      dateISO,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: dateISO === todayISO,
    });
  }

  return days;
}

export function formatDateTimeFriendly(isoDateTime?: string | null): string {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (isNaN(d.getTime())) return '';

  const dateISO = formatDateISO(d);
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = formatFriendlyDate(dateISO);

  return `${dateStr} at ${timeStr}`;
}

export function calculateNextDueDate(
  currentDueDateISO: string | null | undefined,
  rule: RecurrenceRule
): string {
  const baseDate = currentDueDateISO ? parseISODate(currentDueDateISO) : new Date();
  const nextDate = new Date(baseDate);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekdays':
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
  }

  return formatDateISO(nextDate);
}

export function formatRecurrenceLabel(rule?: RecurrenceRule | null): string {
  if (!rule) return '';
  switch (rule.frequency) {
    case 'daily':
      return rule.interval && rule.interval > 1 ? `Every ${rule.interval} days` : 'Every day';
    case 'weekdays':
      return 'Every weekday (Mon-Fri)';
    case 'weekly':
      return rule.interval && rule.interval > 1 ? `Every ${rule.interval} weeks` : 'Every week';
    case 'monthly':
      return rule.interval && rule.interval > 1 ? `Every ${rule.interval} months` : 'Every month';
    default:
      return '';
  }
}

export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function parseDurationToken(token: string): number | null {
  const match = token.match(/^~?(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) return value * 60;
  return value;
}

const DAY_NAME_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/** Parse flexible relative date tokens like ^next friday, ^in 3 days, ^mon, ^today */
export function parseFlexibleDueDate(text: string): string | null {
  const lower = text.toLowerCase();

  // ^today / ^tomorrow
  if (/\^today\b/.test(lower)) return getTodayISO();
  if (/\^tomorrow\b/.test(lower)) {
    return formatDateISO(new Date(Date.now() + 86400000));
  }

  // ^in N days
  const inDays = lower.match(/\^in\s+(\d+)\s+days?\b/);
  if (inDays) {
    const n = parseInt(inDays[1], 10);
    return formatDateISO(new Date(Date.now() + 86400000 * n));
  }

  // ^next friday / ^friday / ^mon
  const dayMatch = lower.match(/\^(?:next\s+)?([a-z]+)\b/);
  if (dayMatch) {
    const dayName = dayMatch[1];
    const targetDow = DAY_NAME_MAP[dayName];
    if (targetDow !== undefined) {
      const today = new Date();
      const currentDow = today.getDay();
      let delta = (targetDow - currentDow + 7) % 7;
      // If "next" is present, or same day already, jump a full week ahead when delta is 0
      if (delta === 0 || /\^next\s+/.test(lower)) {
        if (delta === 0) delta = 7;
      }
      const d = new Date(today);
      d.setDate(today.getDate() + delta);
      return formatDateISO(d);
    }
  }

  return null;
}

export function formatStartTime(startTime?: string | null): string {
  if (!startTime) return '';
  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return startTime;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const DURATION_PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
] as const;

export const PLANNER_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM – 10 PM

/** Planned minutes for load: use duration, or 30m default when startTime is set. */
export function plannedMinutesForTodo(todo: {
  completed?: boolean;
  durationMinutes?: number | null;
  startTime?: string | null;
}): number {
  if (todo.completed) return 0;
  if (todo.durationMinutes && todo.durationMinutes > 0) return todo.durationMinutes;
  if (todo.startTime) return 30;
  return todo.durationMinutes && todo.durationMinutes > 0 ? todo.durationMinutes : 0;
}

export function formatLoadHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
