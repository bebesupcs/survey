import { config, getQuestions, runtime } from '@/lib/server';
export async function GET() {
  const c = await config();
  const rows = await runtime()
    .DB.prepare('SELECT slot,updated_at AS updatedAt FROM site_media')
    .all<{ slot: string; updatedAt: string }>();
  return Response.json(
    {
      version: c.version,
      questions: await getQuestions(c.version),
      ready: !!c.ready && !!c.endpoint && !!runtime().GOOGLE_BRIDGE_SECRET,
      media: Object.fromEntries(
        rows.results.map((item) => [
          item.slot,
          {
            url: `/api/media/${item.slot}?v=${encodeURIComponent(item.updatedAt)}`,
          },
        ]),
      ),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
