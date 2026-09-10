import { db, runtime } from '@/lib/server';
const allowed = new Set(['product', 'background']);
export async function GET(
  _: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  const { slot } = await params;
  if (!allowed.has(slot)) return new Response('Not found', { status: 404 });
  const row = await db()
    .prepare(
      'SELECT object_key AS objectKey,content_type AS contentType FROM site_media WHERE slot=?',
    )
    .bind(slot)
    .first<{ objectKey: string; contentType: string }>();
  if (!row) return new Response('Not found', { status: 404 });
  const object = await runtime().MEDIA.get(row.objectKey);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(object.body, {
    headers: {
      'Content-Type': row.contentType,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
