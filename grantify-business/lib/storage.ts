import { SavedApplication } from './types';

const KEY = 'grantify-business-applications';

export function loadApplications(): SavedApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplication(app: SavedApplication) {
  if (typeof window === 'undefined') return;
  const apps = loadApplications();
  const idx = apps.findIndex((a) => a.id === app.id);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...app, updatedAt: new Date().toISOString() };
  } else {
    apps.unshift(app);
  }
  localStorage.setItem(KEY, JSON.stringify(apps));
}

export function deleteApplication(id: string) {
  if (typeof window === 'undefined') return;
  const apps = loadApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
}
