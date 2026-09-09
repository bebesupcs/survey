import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { questions, type Question } from './survey';
import { normalizeEmail, hasAdminAccess } from './admin-access';
export const runtime = () =>
  env as unknown as {
    DB: D1Database;
    ADMIN_EMAIL?: string;
    INITIAL_ADMIN_EMAILS?: string;
    GOOGLE_BRIDGE_SECRET?: string;
  };
export const db = () => runtime().DB;
export async function config() {
  return (
    (await db()
      .prepare('SELECT * FROM survey_settings WHERE id=1')
      .first<{ version: string; endpoint: string; ready: number }>()) ?? {
      version: '1',
      endpoint: '',
      ready: 0,
    }
  );
}
export async function getQuestions(
  version: string,
): Promise<Question[] | null> {
  if (version === '1') return questions;
  const row = await db()
    .prepare('SELECT questions FROM survey_versions WHERE id=?')
    .bind(version)
    .first<{ questions: string }>();
  return row ? JSON.parse(row.questions) : null;
}
export const ownerEmail = () => normalizeEmail(runtime().ADMIN_EMAIL || '');
export const initialAdminEmails = () =>
  (runtime().INITIAL_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
export async function isOwner() {
  const user = await getChatGPTUser();
  return (
    !!user && !!ownerEmail() && normalizeEmail(user.email) === ownerEmail()
  );
}
export async function isAdmin() {
  const user = await getChatGPTUser();
  if (!user) return false;
  const email = normalizeEmail(user.email);
  if (email === ownerEmail()) return true;
  const row = await db()
    .prepare('SELECT enabled FROM admin_access WHERE email=?')
    .bind(email)
    .first<{ enabled: number }>();
  return hasAdminAccess(
    email,
    ownerEmail(),
    initialAdminEmails(),
    row?.enabled ?? null,
  );
}
export async function listAdmins() {
  const rows = await db()
    .prepare('SELECT email,enabled FROM admin_access ORDER BY email')
    .all<{ email: string; enabled: number }>();
  const map = new Map(initialAdminEmails().map((email) => [email, true]));
  for (const row of rows.results) map.set(row.email, !!row.enabled);
  map.set(ownerEmail(), true);
  return [...map]
    .filter(([, enabled]) => enabled)
    .map(([email]) => ({ email, owner: email === ownerEmail() }));
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export async function bridge(endpoint: string, payload: object) {
  if (
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(
      endpoint,
    )
  )
    throw Error('Google Apps Script 웹 앱 URL을 확인해주세요.');
  const secret = runtime().GOOGLE_BRIDGE_SECRET;
  if (!secret) throw Error('스프레드시트 연결 설정이 필요합니다.');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, secret }),
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw Error('스프레드시트 연결에 실패했습니다.');
  let data;
  try {
    data = (await res.json()) as any;
  } catch {
    throw Error('Google 웹 앱의 접근 권한과 배포 URL을 확인해주세요.');
  }
  if (!data.ok)
    throw Error(
      '스프레드시트 저장을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
    );
  return data;
}
