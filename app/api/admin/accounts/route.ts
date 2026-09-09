import { isOwner, listAdmins, ownerEmail, db, sameOrigin } from '@/lib/server';
import { normalizeEmail, validEmail } from '@/lib/admin-access';
export async function GET() {
  if (!(await isOwner()))
    return Response.json(
      { error: '계정 관리는 소유자만 할 수 있습니다.' },
      { status: 403 },
    );
  return Response.json(
    { accounts: await listAdmins() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(r: Request) {
  if (!sameOrigin(r) || !(await isOwner()))
    return Response.json(
      { error: '계정 관리는 소유자만 할 수 있습니다.' },
      { status: 403 },
    );
  try {
    const raw = await r.text();
    if (raw.length > 2000) throw Error('요청이 너무 큽니다.');
    const data = JSON.parse(raw);
    if (!validEmail(data.email) || !['grant', 'revoke'].includes(data.action))
      throw Error('올바른 이메일과 작업을 입력해주세요.');
    const email = normalizeEmail(data.email);
    if (email === ownerEmail())
      throw Error('소유자 계정은 변경할 수 없습니다.');
    await db()
      .prepare(
        'INSERT INTO admin_access(email,enabled,updated_at,updated_by) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at,updated_by=excluded.updated_by',
      )
      .bind(
        email,
        data.action === 'grant' ? 1 : 0,
        new Date().toISOString(),
        ownerEmail(),
      )
      .run();
    return Response.json({ accounts: await listAdmins() });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '저장하지 못했습니다.' },
      { status: 400 },
    );
  }
}
