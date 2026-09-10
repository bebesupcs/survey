'use client';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { type Question, type VisibilityOperator, sections } from '@/lib/survey';
import Accounts from './accounts';
import MediaManager from './media-manager';

type ConnectionInfo = {
  state: 'checking' | 'connected' | 'disconnected' | 'unverified';
  message: string;
  checkedAt?: string;
};
const formatCheckedAt = (value?: string) =>
  value
    ? new Date(value).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

const operatorLabels: Record<VisibilityOperator, string> = {
  equals: '이 답변일 때 표시',
  not_equals: '이 답변이 아닐 때 표시',
  one_of: '선택한 답변 중 하나일 때 표시',
  not_one_of: '선택한 답변들이 아닐 때 표시',
  answered: '답변했을 때 표시',
  different_answer: '다른 문항의 답변과 다를 때 표시',
};

export default function Editor() {
  const [qs, setQs] = useState<Question[]>([]),
    [version, setVersion] = useState(''),
    [endpoint, setEndpoint] = useState(''),
    [script, setScript] = useState(''),
    [ready, setReady] = useState(false),
    [savedEndpoint, setSavedEndpoint] = useState(''),
    [connection, setConnection] = useState<ConnectionInfo>({
      state: 'checking',
      message: '연결 확인 중...',
    }),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [dirty, setDirty] = useState(false);
  async function load() {
    try {
      const r = await fetch('/api/admin'),
        d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.connection) setConnection(d.connection);
      setQs(d.questions);
      setVersion(d.version);
      setEndpoint(d.endpoint);
      setSavedEndpoint(d.endpoint);
      setScript(d.script);
      setReady(!!d.ready);
      setConnection(d.connection);
    } catch (e) {
      setMessage(String(e));
    }
  }
  useEffect(() => void load(), []);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [dirty]);
  async function act(action: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, questions: qs, version, endpoint }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.connection) setConnection(d.connection);
      if (action === 'save') {
        setVersion(d.version);
        setDirty(false);
        setMessage(
          '질문을 저장했습니다. 새로 설문을 시작하는 고객부터 적용됩니다.',
        );
      } else if (action === 'analysis') {
        setMessage('종합 분석과 개별 상세 시트를 새로 만들었습니다.');
      } else {
        setReady(action === 'connect');
        setMessage(
          action === 'connect'
            ? '스프레드시트 연결을 확인하고 응답 접수를 시작했습니다.'
            : '응답 접수를 중지했습니다.',
        );
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : '처리하지 못했습니다.';
      if (action === 'connect' || action === 'analysis') {
        setConnection({
          state: 'disconnected',
          message: reason,
          checkedAt: new Date().toISOString(),
        });
        if (action === 'connect') setReady(false);
      }
      setMessage(reason);
    } finally {
      setBusy(false);
    }
  }
  function changed(next: Question[]) {
    setQs(next);
    setDirty(true);
  }
  function edit(i: number, patch: Partial<Question>) {
    changed(qs.map((q, j) => (i === j ? { ...q, ...patch } : q)));
  }
  function move(i: number, direction: -1 | 1) {
    const to = i + direction;
    if (to < 0 || to >= qs.length) return;
    const next = [...qs];
    [next[i], next[to]] = [next[to], next[i]];
    changed(next);
  }
  function remove(i: number) {
    const removed = qs[i];
    if (!confirm(`${removed.id} 문항을 삭제할까요?`)) return;
    changed(
      qs
        .filter((_, j) => j !== i)
        .map((q) => ({
          ...q,
          showWhen: q.showWhen?.filter(
            (r) =>
              r.questionId !== removed.id && r.compareQuestionId !== removed.id,
          ),
        })),
    );
  }
  function addQuestion() {
    const id = `Q-${crypto.randomUUID().slice(0, 8)}`;
    changed([
      ...qs,
      {
        id,
        title: '새 질문',
        section: qs.at(-1)?.section ?? 0,
        type: 'single',
        required: false,
        options: ['선택지 1', '선택지 2'],
      },
    ]);
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
      0,
    );
  }
  function addRule(i: number) {
    const source = qs[i - 1];
    if (!source) return;
    edit(i, {
      showWhen: [
        ...(qs[i].showWhen ?? []),
        {
          questionId: source.id,
          operator: 'one_of',
          values: source.options.slice(0, 1),
        },
      ],
    });
  }
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          <img
            src="/bebesup-logo.png"
            alt="베베숲 Bebesup"
            className="brand-logo"
          />
          <span>설문 관리</span>
        </a>
        <a href="/" target="_blank" rel="noreferrer">
          설문 미리보기 ↗
        </a>
      </header>
      <main className="admin">
        <h1>고객 경험 설문 관리</h1>
        <p>문항 순서와 내용, 조건부 노출을 직접 관리할 수 있습니다.</p>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <Accounts />
        <MediaManager />
        <section>
          <h2>구글 스프레드시트 연결</h2>
          <div className="connection-status" data-state={connection.state}>
            <strong>[Google Sheets 연결 상태]</strong>
            <span className="connection-state">
              {connection.state === 'checking'
                ? '연결 확인 중...'
                : connection.state === 'connected'
                  ? '🟢 연결됨'
                  : connection.state === 'unverified'
                    ? '🟠 확인 필요'
                    : '🔴 연결되지 않음'}
            </span>
            <span>{connection.message}</span>
            {connection.checkedAt && (
              <small>
                마지막 확인: {formatCheckedAt(connection.checkedAt)}
              </small>
            )}
            {connection.state === 'connected' && (
              <small>
                {ready ? '현재 설문 응답 접수 중' : '현재 설문 응답 접수 중지'}
              </small>
            )}
          </div>
          <p>
            <a
              href="https://docs.google.com/spreadsheets/d/1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s/edit?gid=1519874531"
              target="_blank"
              rel="noreferrer"
            >
              응답 저장용 스프레드시트 열기 ↗
            </a>
          </p>
          <p className="muted">
            기존 응답은 그대로 유지합니다. ‘베베숲_응답’에는 1행 헤더 아래 한
            행씩 누적되고, 분석용으로 ‘베베숲_분석_종합’과 개인정보를 제외한
            ‘베베숲_응답_상세’를 만듭니다.
          </p>
          <details>
            <summary>연결 코드 설치 또는 업데이트</summary>
            <ol>
              <li>
                스프레드시트에서 <strong>확장 프로그램 → Apps Script</strong>를
                엽니다.
              </li>
              <li>
                기존 Code.gs의 내용을 아래 연결 코드 전체로 교체하고 저장합니다.
              </li>
              <li>
                <strong>배포 → 새 배포 → 웹 앱</strong>에서 실행 계정은 ‘나’,
                액세스 권한은 ‘모든 사용자’로 설정합니다.
              </li>
              <li>
                발급된 <strong>/exec로 끝나는 웹 앱 URL</strong>을 아래에
                입력합니다.
              </li>
            </ol>
            <button
              className="secondary"
              disabled={!script}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(script);
                  setMessage('연결 코드를 복사했습니다.');
                } catch {
                  setMessage('아래 코드 상자를 선택해 직접 복사해주세요.');
                }
              }}
            >
              연결 코드 복사
            </button>
            <textarea
              aria-label="구글 Apps Script 연결 코드"
              readOnly
              value={script}
              style={{
                height: 210,
                marginTop: 16,
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            />
          </details>
          <label>
            웹 앱 URL
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/…/exec"
              value={endpoint}
              onChange={(e) => {
                const value = e.target.value;
                setEndpoint(value);
                if (value !== savedEndpoint)
                  setConnection({
                    state: 'unverified',
                    message:
                      '변경한 URL은 아직 실제 연결을 확인하지 않았습니다.',
                  });
              }}
            />
          </label>
          <div className="row">
            <button
              className="primary"
              disabled={busy || !endpoint}
              onClick={() => act('connect')}
            >
              {busy ? '확인 중…' : '연결 확인 및 접수 시작'}
            </button>
            {ready && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => act('pause')}
              >
                응답 접수 중지
              </button>
            )}
            <button
              className="secondary"
              disabled={busy || connection.state !== 'connected'}
              onClick={() => act('analysis')}
            >
              분석 시트 만들기/새로고침
            </button>
          </div>
          <p className="muted">
            인터뷰와 혜택 제공이 종료되면 Apps Script에서
            scheduleContactDeletion을 한 번 실행하세요. 90일 후 이름과 연락처를
            삭제합니다.
          </p>
          <details>
            <summary>기존 Apps Script의 90일 예약 적용 방법</summary>
            <p>
              기존 함수를{' '}
              <a href="/retention-90-days.txt" target="_blank" rel="noreferrer">
                90일 예약 코드
              </a>
              로 교체하고 저장해주세요.
            </p>
          </details>
        </section>
        <section>
          <div className="row admin-heading">
            <div>
              <h2>설문 문항 편집</h2>
              <p className="muted">
                조건을 여러 개 추가하면 모든 조건을 만족할 때만 질문이
                표시됩니다.
              </p>
            </div>
            <div className="admin-actions">
              <button className="secondary" onClick={addQuestion}>
                ＋ 질문 추가
              </button>
              <button
                className="primary"
                disabled={busy || !dirty}
                onClick={() => act('save')}
              >
                {busy ? '저장 중…' : dirty ? '수정 내용 저장' : '저장됨'}
              </button>
            </div>
          </div>
          {qs.map((question, i) => {
            const earlier = qs.slice(0, i);
            return (
              <details
                id={question.id}
                key={question.id}
                className="question-editor"
              >
                <summary>
                  <span>
                    {i + 1}. {question.title}
                  </span>
                  <small>{question.id}</small>
                </summary>
                <div className="question-toolbar">
                  <button
                    className="secondary compact"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑ 위로
                  </button>
                  <button
                    className="secondary compact"
                    disabled={i === qs.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓ 아래로
                  </button>
                  <button className="danger compact" onClick={() => remove(i)}>
                    삭제
                  </button>
                </div>
                <div className="admin-grid">
                  <label>
                    구간
                    <select
                      value={question.section}
                      onChange={(e) =>
                        edit(i, { section: Number(e.target.value) })
                      }
                    >
                      {sections.map((name, s) => (
                        <option key={name} value={s}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    답변 방식
                    <select
                      value={question.type}
                      onChange={(e) => {
                        const type = e.target.value as Question['type'];
                        edit(i, {
                          type,
                          options: ['text', 'phone'].includes(type)
                            ? []
                            : question.options.length
                              ? question.options
                              : ['선택지 1', '선택지 2'],
                        });
                      }}
                    >
                      <option value="single">하나 선택</option>
                      <option value="multi">여러 개 선택</option>
                      <option value="text">주관식</option>
                      <option value="phone">전화번호</option>
                      <option value="score">점수</option>
                    </select>
                  </label>
                </div>
                <label>
                  질문
                  <input
                    type="text"
                    maxLength={500}
                    value={question.title}
                    onChange={(e) => edit(i, { title: e.target.value })}
                  />
                </label>
                {question.options.length > 0 && (
                  <label>
                    선택지 <span className="muted">(한 줄에 하나)</span>
                    <textarea
                      value={question.options.join('\n')}
                      onChange={(e) =>
                        edit(i, {
                          options: e.target.value
                            .split('\n')
                            .filter((x) => x.trim()),
                        })
                      }
                    />
                  </label>
                )}
                <label>
                  도움말
                  <input
                    type="text"
                    value={question.hint ?? ''}
                    onChange={(e) => edit(i, { hint: e.target.value })}
                    placeholder="고객에게 보여줄 추가 설명"
                  />
                </label>
                <label className="check-line">
                  <Checkbox
                    checked={question.required}
                    onCheckedChange={(v) => edit(i, { required: !!v })}
                  />{' '}
                  필수 응답
                </label>
                <div className="condition-box">
                  <div className="row">
                    <div>
                      <strong>노출 조건</strong>
                      <p className="muted">
                        조건이 없으면 모든 고객에게 표시됩니다.
                      </p>
                    </div>
                    <button
                      className="secondary compact"
                      disabled={!earlier.length}
                      onClick={() => addRule(i)}
                    >
                      ＋ 조건 추가
                    </button>
                  </div>
                  {!question.showWhen?.length && (
                    <p className="condition-always">항상 표시</p>
                  )}
                  {question.showWhen?.map((rule, ri) => {
                    const source = qs.find((q) => q.id === rule.questionId);
                    return (
                      <div className="condition-row" key={ri}>
                        <select
                          value={rule.questionId}
                          onChange={(e) => {
                            const src = qs.find((q) => q.id === e.target.value),
                              next = [...(question.showWhen ?? [])];
                            next[ri] = {
                              questionId: e.target.value,
                              operator: 'one_of',
                              values: src?.options.slice(0, 1) ?? [],
                            };
                            edit(i, { showWhen: next });
                          }}
                        >
                          {earlier.map((q) => (
                            <option value={q.id} key={q.id}>
                              {q.id} · {q.title}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const next = [...(question.showWhen ?? [])];
                            next[ri] = {
                              ...rule,
                              operator: e.target.value as VisibilityOperator,
                            };
                            edit(i, { showWhen: next });
                          }}
                        >
                          {Object.entries(operatorLabels).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                        {rule.operator === 'different_answer' ? (
                          <select
                            value={rule.compareQuestionId ?? ''}
                            onChange={(e) => {
                              const next = [...(question.showWhen ?? [])];
                              next[ri] = {
                                ...rule,
                                compareQuestionId: e.target.value,
                              };
                              edit(i, { showWhen: next });
                            }}
                          >
                            <option value="">비교할 질문 선택</option>
                            {earlier
                              .filter((q) => q.id !== rule.questionId)
                              .map((q) => (
                                <option value={q.id} key={q.id}>
                                  {q.id} · {q.title}
                                </option>
                              ))}
                          </select>
                        ) : rule.operator !== 'answered' ? (
                          <select
                            multiple
                            value={rule.values ?? []}
                            onChange={(e) => {
                              const values = Array.from(
                                  e.target.selectedOptions,
                                ).map((o) => o.value),
                                next = [...(question.showWhen ?? [])];
                              next[ri] = { ...rule, values };
                              edit(i, { showWhen: next });
                            }}
                            aria-label="조건 답변 선택"
                          >
                            {source?.options.map((o) => (
                              <option value={o} key={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="muted">답변 내용과 무관</span>
                        )}
                        <button
                          className="danger compact"
                          onClick={() =>
                            edit(i, {
                              showWhen: question.showWhen?.filter(
                                (_, j) => j !== ri,
                              ),
                            })
                          }
                        >
                          조건 삭제
                        </button>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
          <button className="secondary add-bottom" onClick={addQuestion}>
            ＋ 질문 추가
          </button>
        </section>
      </main>
    </>
  );
}
