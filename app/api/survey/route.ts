import { config, getQuestions, runtime } from '@/lib/server';
export async function GET() {
  const c = await config();
  return Response.json(
    {
      version: c.version,
      questions: await getQuestions(c.version),
      ready: !!c.ready && !!c.endpoint && !!runtime().GOOGLE_BRIDGE_SECRET,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
