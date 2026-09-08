import {
  isAdmin,
  config,
  getQuestions,
  db,
  bridge,
  runtime,
  sameOrigin,
} from '@/lib/server';
import { questions } from '@/lib/survey';
import { appsScript } from '@/lib/apps-script';
const locked = ['Q7', 'Q10', 'Q12', 'Q14', 'Q24', 'Q26', 'Q31'];
export async function GET() {
  if (!(await isAdmin()))
    return Response.json(
      { error: '관리자 계정으로 로그인해주세요.' },
      { status: 403 },
    );
  const c = await config();
  return Response.json(
    {
      ...c,
      questions: await getQuestions(c.version),
      script: appsScript(runtime().GOOGLE_BRIDGE_SECRET || '연결키_설정_필요'),
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
    const text = await r.text();
    if (text.length > 200000) throw Error('설정이 너무 큽니다.');
    const data = JSON.parse(text),
      c = await config();
    if (data.action === 'connect') {
      const result = await bridge(data.endpoint, { action: 'ping' });
      if (
        result.spreadsheetId !== '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s'
      )
        throw Error('저장 대상 스프레드시트가 일치하지 않습니다.');
      await db()
        .prepare(
          'INSERT INTO survey_settings (id,version,endpoint,ready) VALUES (1,?,?,1) ON CONFLICT(id) DO UPDATE SET endpoint=excluded.endpoint,ready=1',
        )
        .bind(c.version, data.endpoint)
        .run();
      return Response.json({ ok: true });
    }
    if (data.action === 'pause') {
      await db().prepare('UPDATE survey_settings SET ready=0 WHERE id=1').run();
      return Response.json({ ok: true });
    }
    if (
      data.action !== 'save' ||
      !Array.isArray(data.questions) ||
      data.questions.length !== questions.length
    )
      throw Error('문항 구성을 확인해주세요.');
    if (data.version !== c.version)
      return Response.json(
        {
          error: '다른 화면에서 수정되었습니다. 새로고침 후 다시 저장해주세요.',
        },
        { status: 409 },
      );
    const updated = questions.map((original) => {
      const edited = data.questions.find((x: any) => x.id === original.id);
      if (
        !edited ||
        typeof edited.title !== 'string' ||
        !edited.title.trim() ||
        edited.title.length > 500 ||
        !Array.isArray(edited.options) ||
        edited.options.length > 40 ||
        edited.options.some(
          (o: any) => typeof o !== 'string' || !o.trim() || o.length > 200,
        ) ||
        new Set(edited.options).size !== edited.options.length
      )
        throw Error(original.id + '의 질문과 선택지를 확인해주세요.');
      if (original.options.length && edited.options.length < 2)
        throw Error(original.id + '은 최소 두 개의 선택지가 필요합니다.');
      return {
        ...original,
        title: edited.title.trim(),
        options:
          locked.includes(original.id) || original.type === 'score'
            ? original.options
            : edited.options,
        required: ['Q29', 'Q30', 'Q31'].includes(original.id)
          ? true
          : !!edited.required,
      };
    });
    const version = crypto.randomUUID();
    await db().batch([
      db()
        .prepare(
          'INSERT INTO survey_versions(id,questions,created_at) VALUES(?,?,?)',
        )
        .bind(version, JSON.stringify(updated), new Date().toISOString()),
      db()
        .prepare(
          'INSERT INTO survey_settings(id,version,endpoint,ready) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version',
        )
        .bind(version, c.endpoint, c.ready),
    ]);
    return Response.json({ ok: true, version });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '저장하지 못했습니다.' },
      { status: 400 },
    );
  }
}
