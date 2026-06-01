import { supabase, API_BASE_URL } from './supabase';

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function syncProfile() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/auth/sync-profile`, {
    method: 'POST',
    headers,
  });
  return res.json();
}

export async function fetchCircles() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/circles`, { headers });
  if (!res.ok) throw new Error('Failed to fetch circles');
  return res.json();
}
