import { cookies } from 'next/headers';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export const SESSION_COOKIE_NAME = 'cms_session';

export function getSession(): UserSession | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) return null;
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch (err) {
    return null;
  }
}

export const DEFAULT_USERS: UserSession[] = [
  { id: 'user_jasmine', name: 'Jasmine', email: 'jasmine@portalnoticias.com', role: 'EDITOR' },
  { id: 'user_mateo', name: 'Mateo', email: 'mateo@portalnoticias.com', role: 'ADMIN' },
  { id: 'user_editorial_ai', name: 'Redacción IA', email: 'ai@editorial.internal', role: 'REDACTOR' },
];
