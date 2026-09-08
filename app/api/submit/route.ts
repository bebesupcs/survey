import { config, getQuestions, bridge, sameOrigin } from '@/lib/server';
import { cleanAnswers, validate } from '@/lib/survey';
export async function POST(r: Request) {
  if (!sameOrigin(r))
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 403 });
  try {
    const text = await r.text();
    if (text.length > 100000)
      return Response.json({ error: '응답이 너무 깁니다.' }, { status: 413 });
    const body = JSON.parse(text);
    if (
      typeof body.id !== 'string' ||
      !/^[0-9a-f-]{36}$/.test(body.id) ||
      typeof body.version !== 'string' ||
      !body.answers ||
      typeof body.answers !== 'object' ||
      Array.isArray(body.answers)
    )
      return Response.json(
        { error: '응답 형식을 확인해주세요.' },
        { status: 400 },
      );
    const qs = await getQuestions(body.version);
    if (!qs)
      return Response.json(
        { error: '설문 버전을 찾을 수 없습니다. 새로고침해주세요.' },
        { status: 400 },
      );
    const answers = cleanAnswers(qs, body.answers),
      error = validate(qs, answers);
    if (error) return Response.json({ error }, { status: 400 });
    const c = await config();
    if (!c.ready)
      return Response.json(
        { error: '아직 응답 접수가 시작되지 않았습니다.' },
        { status: 503 },
      );
    await bridge(c.endpoint, {
      action: 'submit',
      id: body.id,
      version: body.version,
      submittedAt: new Date().toISOString(),
      answers,
      questions: qs.map((q) => ({
        id: q.id,
        title: q.title,
        options: q.options,
        type: q.type,
      })),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : '제출하지 못했습니다. 다시 시도해주세요.',
      },
      { status: 502 },
    );
  }
}
