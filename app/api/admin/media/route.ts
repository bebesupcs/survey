import { db, runtime, isAdmin, sameOrigin } from '@/lib/server';
const allowed = new Set(['product', 'background']);
export async function GET() {
  if (!(await isAdmin()))
    return Response.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  const rows = await db()
    .prepare('SELECT slot,updated_at AS updatedAt FROM site_media')
    .all<{ slot: string; updatedAt: string }>();
  return Response.json(
    {
      media: Object.fromEntries(
        rows.results.map((x) => [
          x.slot,
          {
            url: `/api/media/${x.slot}?v=${encodeURIComponent(x.updatedAt)}`,
            updatedAt: x.updatedAt,
          },
        ]),
      ),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(r: Request) {
  if (!sameOrigin(r) || !(await isAdmin()))
    return Response.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  try {
    const form = await r.formData(),
      slotValue = form.get('slot'),
      slot = typeof slotValue === 'string' ? slotValue : '',
      file = form.get('file');
    if (!allowed.has(slot) || !(file instanceof File))
      throw Error('이미지와 위치를 확인해주세요.');
    if (file.size > 5 * 1024 * 1024)
      throw Error('이미지는 5MB 이하여야 합니다.');
    const ext: { [key: string]: string } = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    if (!ext[file.type])
      throw Error('PNG, JPG, WEBP 이미지만 사용할 수 있습니다.');
    const old = await db()
      .prepare('SELECT object_key AS objectKey FROM site_media WHERE slot=?')
      .bind(slot)
      .first<{ objectKey: string }>();
    const key = `survey-media/${slot}/${crypto.randomUUID()}.${ext[file.type]}`,
      updatedAt = new Date().toISOString();
    await runtime().MEDIA.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
    });
    await db()
      .prepare(
        'INSERT INTO site_media(slot,object_key,content_type,updated_at) VALUES(?,?,?,?) ON CONFLICT(slot) DO UPDATE SET object_key=excluded.object_key,content_type=excluded.content_type,updated_at=excluded.updated_at',
      )
      .bind(slot, key, file.type, updatedAt)
      .run();
    if (old?.objectKey) await runtime().MEDIA.delete(old.objectKey);
    return Response.json({
      ok: true,
      url: `/api/media/${slot}?v=${encodeURIComponent(updatedAt)}`,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '업로드하지 못했습니다.' },
      { status: 400 },
    );
  }
}
export async function DELETE(r: Request) {
  if (!sameOrigin(r) || !(await isAdmin()))
    return Response.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  try {
    const { slot } = (await r.json()) as { slot: string };
    if (!allowed.has(slot)) throw Error('이미지 위치를 확인해주세요.');
    const old = await db()
      .prepare('SELECT object_key AS objectKey FROM site_media WHERE slot=?')
      .bind(slot)
      .first<{ objectKey: string }>();
    if (old?.objectKey) await runtime().MEDIA.delete(old.objectKey);
    await db().prepare('DELETE FROM site_media WHERE slot=?').bind(slot).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '삭제하지 못했습니다.' },
      { status: 400 },
    );
  }
}
