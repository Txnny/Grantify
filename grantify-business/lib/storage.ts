import { SavedApplication } from './types';
import { createClient } from './supabase';

const LOCAL_KEY = 'gb-applications';

// ── localStorage helpers ──────────────────────────────────────────────────────

function localLoad(): SavedApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function localSave(apps: SavedApplication[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(apps));
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function getUser() {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadApplications(): Promise<SavedApplication[]> {
  const user = await getUser();
  if (user) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gb_applications')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        grantName: row.grant_name,
        companyName: row.company_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        session: row.session_data,
      }));
    } catch {
      // fall through to localStorage
    }
  }
  return localLoad();
}

export async function saveApplication(app: SavedApplication) {
  const user = await getUser();
  if (user) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('gb_applications').upsert({
        id: app.id,
        user_id: user.id,
        grant_name: app.grantName,
        company_name: app.companyName,
        status: app.status,
        session_data: app.session,
        updated_at: new Date().toISOString(),
      });
      if (!error) return;
    } catch {
      // fall through to localStorage
    }
  }
  // localStorage fallback
  const apps = localLoad();
  const idx = apps.findIndex((a) => a.id === app.id);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...app, updatedAt: new Date().toISOString() };
  } else {
    apps.unshift(app);
  }
  localSave(apps);
}

export async function deleteApplication(id: string) {
  const user = await getUser();
  if (user) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('gb_applications').delete().eq('id', id);
      if (!error) return;
    } catch {
      // fall through to localStorage
    }
  }
  localSave(localLoad().filter((a) => a.id !== id));
}
