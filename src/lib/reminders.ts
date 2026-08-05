export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied');
  }
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function triggerBrowserNotification(title: string, body?: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body || 'Reminder from Lumen',
        icon: '/favicon.ico',
      });
    } catch (err) {
      console.warn('Failed to trigger notification:', err);
    }
  }
}
