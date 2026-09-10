import {
  isAdmin,
  config,
  getQuestions,
  db,
  bridge,
  runtime,
  sameOrigin,
} from '@/lib/server';
import {
  CURRENT_SURVEY_VERSION,
  type Question,
  type VisibilityOperator,
} from '@/lib/survey';
import { appsScript } from '@/lib/apps-script';
const types = new Set(['single', 'multi', 'text', 'phone', 'score']);
const operators = new Set<VisibilityOperator>([
  'equals',
  'not_equals',
  'one_of',
  'not_one_of',
  'answered',
  'different_answer',
]);
const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
type ConnectionStatus = {
  state: 'connected' | 'disconnected';
  message: string;
  checkedAt?: string;
};
async function checkConnection(endpoint: string): Promise<ConnectionStatus> {
  if (!endpoint)
    return {
      state: 'disconnected',
      message: '저장된 Apps Script 웹 앱 URL이 없습니다.',
    };
  const checkedAt = new Date().toISOString();
  try {
    const result = await bridge(endpoint, { action: 'ping' });
    if (result.spreadsheetId !== SPREADSHEET_ID)
      return {
        state: 'disconnected',
        message: '연결된 Google Sheets가 응답 저장용 시트와 다릅니다.',
        checkedAt,
      };
    return {
      state: 'connected',
      message: '응답 저장 가능',
      checkedAt,
    };
  } catch (error) {
    return {
      state: 'disconnected',
      message:
        error instanceof Error
          ? error.message
          : 'Apps Script 연결을 확인하지 못했습니다.',
      checkedAt,
    };
  }
}
export async function GET() {
  if (!(await isAdmin()))
    return Response.json(
      { error: '관리자 계정으로 로그인해주세요.' },
      { status: 403 },
    );
  const c = await config();
  const connection = await checkConnection(c.endpoint);
  return Response.json(
    {
      ...c,
      questions: await getQuestions(c.version),
      script: appsScript(runtime().GOOGLE_BRIDGE_SECRET || '연결키_설정_필요'),
      connection,
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
      const connection = await checkConnection(data.endpoint);
      if (connection.state !== 'connected') throw Error(connection.message);
      await db()
        .prepare(
          'INSERT INTO survey_settings (id,version,endpoint,ready) VALUES (1,?,?,1) ON CONFLICT(id) DO UPDATE SET endpoint=excluded.endpoint,ready=1',
        )
        .bind(c.version, data.endpoint)
        .run();
      return Response.json({ ok: true, connection });
    }
    if (data.action === 'analysis') {
      try {
        await bridge(c.endpoint, {
          action: 'refreshAnalysis',
          questions: await getQuestions(c.version),
        });
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : '요청을 처리하지 못했습니다.';
        throw Error(
          '분석 시트 생성 실패: ' +
            reason +
            ' 기존 Apps Script가 최신 연결 코드로 배포되었는지 확인해주세요.',
        );
      }
      return Response.json({
        ok: true,
        connection: {
          state: 'connected',
          message: '응답 저장 가능',
          checkedAt: new Date().toISOString(),
        },
      });
    }
    if (data.action === 'pause') {
      await db().prepare('UPDATE survey_settings SET ready=0 WHERE id=1').run();
      return Response.json({ ok: true });
    }
    if (
      data.action !== 'save' ||
      !Array.isArray(data.questions) ||
      data.questions.length < 1 ||
      data.questions.length > 80
    )
      throw Error('문항 구성을 확인해주세요.');
    if (data.version !== c.version)
      return Response.json(
        {
          error: '다른 화면에서 수정되었습니다. 새로고침 후 다시 저장해주세요.',
        },
        { status: 409 },
      );
    const ids = new Set<string>();
    const updated: Question[] = data.questions.map((edited: any) => {
      if (
        !edited ||
        typeof edited.id !== 'string' ||
        !/^[A-Za-z0-9_-]{1,40}$/.test(edited.id) ||
        ids.has(edited.id) ||
        typeof edited.title !== 'string' ||
        !edited.title.trim() ||
        edited.title.length > 500 ||
        !types.has(edited.type) ||
        !Number.isInteger(edited.section) ||
        edited.section < 0 ||
        edited.section > 8 ||
        !Array.isArray(edited.options) ||
        edited.options.length > 40 ||
        edited.options.some(
          (o: any) => typeof o !== 'string' || !o.trim() || o.length > 200,
        ) ||
        new Set(edited.options).size !== edited.options.length
      )
        throw Error(
          (edited?.id || '문항') + '의 질문과 선택지를 확인해주세요.',
        );
      ids.add(edited.id);
      if (
        ['single', 'multi', 'score'].includes(edited.type) &&
        edited.options.length < 2
      )
        throw Error(edited.id + '은 최소 두 개의 선택지가 필요합니다.');
      if (['text', 'phone'].includes(edited.type) && edited.options.length)
        throw Error(edited.id + '의 답변 방식과 선택지를 확인해주세요.');
      const showWhen = Array.isArray(edited.showWhen) ? edited.showWhen : [];
      if (
        showWhen.length > 8 ||
        showWhen.some(
          (rule: any) =>
            !rule ||
            typeof rule.questionId !== 'string' ||
            !operators.has(rule.operator) ||
            (rule.values !== undefined &&
              (!Array.isArray(rule.values) ||
                rule.values.some((v: any) => typeof v !== 'string'))) ||
            (rule.operator === 'different_answer' &&
              typeof rule.compareQuestionId !== 'string'),
        )
      )
        throw Error(edited.id + '의 노출 조건을 확인해주세요.');
      return {
        id: edited.id,
        title: edited.title.trim(),
        section: edited.section,
        type: edited.type,
        required: !!edited.required,
        options: edited.options,
        max:
          edited.type === 'multi' &&
          Number.isInteger(edited.max) &&
          edited.max > 0
            ? edited.max
            : undefined,
        hint:
          typeof edited.hint === 'string' && edited.hint.trim()
            ? edited.hint.trim()
            : undefined,
        showWhen,
      };
    });
    const positions = new Map(updated.map((item, i) => [item.id, i]));
    for (const item of updated) {
      for (const rule of item.showWhen ?? []) {
        if (!ids.has(rule.questionId) || rule.questionId === item.id)
          throw Error(item.id + '의 조건 질문을 확인해주세요.');
        if (rule.compareQuestionId && !ids.has(rule.compareQuestionId))
          throw Error(item.id + '의 비교 질문을 확인해주세요.');
        if (
          (positions.get(rule.questionId) ?? 999) >=
          (positions.get(item.id) ?? -1)
        )
          throw Error(
            item.id + '의 조건 질문은 이 문항보다 위에 있어야 합니다.',
          );
      }
    }
    const version = CURRENT_SURVEY_VERSION + ':' + crypto.randomUUID();
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
