import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { questions, type Question } from './survey';
export const runtime = () =>
  env as unknown as {
    DB: D1Database;
    ADMIN_EMAIL?: string;
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
export async function isAdmin() {
  const user = await getChatGPTUser();
  return (
    !!user &&
    !!runtime().ADMIN_EMAIL &&
    user.email.toLowerCase() === runtime().ADMIN_EMAIL!.toLowerCase()
  );
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
