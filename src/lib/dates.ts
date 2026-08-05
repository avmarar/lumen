export function getTodayISO(): string {
  const d = new Date();
  return formatDateISO(d);
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

export function getUpcomingDays(count = 7): Array<{ dateISO: string; label: string; dayName: string; isToday: boolean }> {
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

export function getWeekDays(): Array<{ dateISO: string; dayName: string; dateNum: number; isToday: boolean }> {
  const today = new Date();
  const todayISO = formatDateISO(today);

  // Find Monday of current week
  const dayOfWeek = today.getDay(); // 0 is Sun
  const distanceToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  
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
