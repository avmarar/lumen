import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lumen — Calm Personal Planner',
    short_name: 'Lumen',
    description:
      'A local-first personal planner for todos, checklists, reminders, and week planning.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFBEB',
    theme_color: '#D97706',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
