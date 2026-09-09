'use client';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { type Question, sections } from '@/lib/survey';
import Accounts from './accounts';
const locked = ['Q7', 'Q10', 'Q12', 'Q14', 'Q24', 'Q26', 'Q31', 'Q22'];
export default function Editor() {
  const [qs, setQs] = useState<Question[]>([]),
    [version, setVersion] = useState(''),
    [endpoint, setEndpoint] = useState(''),
    [script, setScript] = useState(''),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [dirty, setDirty] = useState(false);
  async function load() {
    try {
      const r = await fetch('/api/admin');
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setQs(d.questions);
      setVersion(d.version);
      setEndpoint(d.endpoint);
      setScript(d.script);
      setReady(!!d.ready);
    } catch (e) {
      setMessage(String(e));
    }
  }
  useEffect(() => {
    load();
  }, []);
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
      if (action === 'save') {
        setVersion(d.version);
        setDirty(false);
        setMessage(
          '질문을 저장했습니다. 새로 설문을 시작하는 고객부터 변경 내용이 적용됩니다.',
        );
      } else {
        setReady(action === 'connect');
        setMessage(
          action === 'connect'
            ? '스프레드시트 연결을 확인하고 응답 접수를 시작했습니다.'
            : '응답 접수를 중지했습니다.',
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  function edit(i: number, patch: Partial<Question>) {
    setQs((old) => old.map((q, j) => (i === j ? { ...q, ...patch } : q)));
    setDirty(true);
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
        <p>질문을 수정하고 응답 수집을 관리하세요.</p>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <Accounts />
        <section>
          <h2>구글 스프레드시트 연결</h2>
          <p className="notice">
            {ready ? '연결 완료 · 응답 접수 중' : '연결 대기 · 응답 접수 전'}
          </p>
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
            기존 탭을 덮어쓰지 않고 ‘베베숲_응답’과 ‘베베숲_문항사전’ 탭을
            추가합니다. 복수 선택은 선택지별 1/0 열도 저장해 통계를 내기 쉽게
            구성했습니다.
          </p>
          <details>
            <summary>최초 1회 연결하기</summary>
            <ol>
              <li>
                위 스프레드시트에서 <strong>확장 프로그램 → Apps Script</strong>
                를 엽니다.
              </li>
              <li>
                새 스크립트 파일에 아래 연결 코드를 붙여넣고 저장합니다. 기존
                스크립트가 있다면 덮어쓰지 마세요.
              </li>
              <li>
                <strong>배포 → 새 배포 → 웹 앱</strong>을 선택합니다. 실행
                계정은 ‘나’, 액세스 권한은 ‘모든 사용자’로 설정하고 Google 권한
                요청을 승인합니다. 조직 정책으로 이 옵션이 없으면 조직
                관리자에게 문의해주세요.
              </li>
              <li>
                발급된 <strong>/exec로 끝나는 웹 앱 URL</strong>을 아래에
                붙여넣고 연결합니다.
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
            <p className="muted">
              이 코드는 전용 연결키를 포함합니다. 관리자만 보관해주세요.
            </p>
            <a
              href="https://developers.google.com/apps-script/guides/web?hl=ko"
              target="_blank"
              rel="noreferrer"
            >
              Google 공식 웹 앱 배포 안내 ↗
            </a>
          </details>
          <label>
            웹 앱 URL
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/…/exec"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
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
          </div>
          <p className="muted">
            인터뷰와 혜택 제공이 종료되면 Apps Script에서
            scheduleContactDeletion을 한 번 실행하세요. 90일 후 이름과 연락처를
            삭제합니다. 내려받은 사본은 별도로 삭제해주세요.
          </p>
          <details>
            <summary>기존 Apps Script의 90일 예약 적용 방법</summary>
            <p>
              이미 연결한 Apps Script에서는 기존 scheduleContactDeletion 함수만{' '}
              <a href="/retention-90-days.txt" target="_blank" rel="noreferrer">
                90일 예약 코드
              </a>
              로 교체하고 저장해주세요. 예약 시점은 함수를 실행한 날을 기준으로
              합니다.
            </p>
            <p>
              이미 예약된 29일 삭제 트리거는 그대로 유지됩니다. 변경이 필요한
              경우 Google Apps Script의 트리거 화면에서 기존 예약을
              확인해주세요. 기존 응답에 안내한 보유 기간은 별도로 관리해주세요.
            </p>
          </details>
        </section>
        <section>
          <div className="row">
            <div>
              <h2>설문 문항 편집</h2>
              <p className="muted">
                질문과 선택지를 수정한 후 저장하세요. 고객 유형 분기에 쓰이는
                선택지는 고정되어 있습니다. Q4·Q5에 원하는 타 브랜드를 한 줄씩
                추가할 수 있습니다.
              </p>
            </div>
            <div style={{ flex: '0 0 auto', alignSelf: 'center' }}>
              <button
                className="primary"
                disabled={busy || !dirty}
                onClick={() => act('save')}
              >
                {busy ? '저장 중…' : dirty ? '수정 내용 저장' : '저장됨'}
              </button>
            </div>
          </div>
          {qs.map((q, i) => (
            <details key={q.id}>
              <summary>
                {q.id}　{q.title}
              </summary>
              <p className="muted">
                {sections[q.section]} ·{' '}
                {q.max
                  ? `최대 ${q.max}개 선택`
                  : q.type === 'multi'
                    ? '복수 선택'
                    : q.type === 'text'
                      ? '주관식'
                      : '단일 응답'}
              </p>
              <label>
                질문
                <input
                  type="text"
                  maxLength={500}
                  value={q.title}
                  onChange={(e) => edit(i, { title: e.target.value })}
                />
              </label>
              {q.options.length > 0 && (
                <label>
                  선택지 (한 줄에 하나)
                  <textarea
                    readOnly={locked.includes(q.id)}
                    value={q.options.join('\n')}
                    onChange={(e) =>
                      edit(i, { options: e.target.value.split('\n') })
                    }
                  />
                  {locked.includes(q.id) && (
                    <span className="muted">
                      분기와 점수 계산을 위해 선택지를 고정했습니다.
                    </span>
                  )}
                </label>
              )}
              <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Checkbox
                  disabled={['Q29', 'Q30', 'Q31'].includes(q.id)}
                  checked={q.required}
                  onCheckedChange={(v) => edit(i, { required: !!v })}
                />
                필수 응답
              </label>
            </details>
          ))}
          <p className="muted">
            문항 번호와 기존 응답은 유지됩니다. 질문 변경 이력은 설문 버전과
            문항사전으로 구분됩니다.
          </p>
        </section>
      </main>
    </>
  );
}
