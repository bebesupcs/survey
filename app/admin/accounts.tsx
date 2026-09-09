'use client';
import { useEffect, useState } from 'react';
export default function Accounts() {
  const [accounts, setAccounts] = useState<{ email: string; owner: boolean }[]>(
      [],
    ),
    [email, setEmail] = useState(''),
    [allowed, setAllowed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    fetch('/api/admin/accounts')
      .then(async (r) => {
        if (r.status === 403) return;
        const d: any = await r.json();
        if (!r.ok) throw Error(d.error);
        setAllowed(true);
        setAccounts(d.accounts);
      })
      .catch(() =>
        setMessage('관리자 계정 목록을 불러오지 못했습니다. 새로고침해주세요.'),
      );
  }, []);
  async function change(action: string, target: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: target }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setAccounts(d.accounts);
      if (action === 'grant') setEmail('');
      setMessage(
        action === 'grant'
          ? '관리자 권한을 부여했습니다. 비공개 사이트 공유 설정에서도 해당 이메일이 허용되어 있어야 접속할 수 있습니다.'
          : '관리자 권한을 해제했습니다. 사이트 자체 접근도 막으려면 사이트 공유 설정에서도 제거해주세요.',
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  if (!allowed)
    return message ? (
      <p role="status" className="notice">
        {message}
      </p>
    ) : null;
  return (
    <section id="accounts">
      <h2>관리자 계정 관리</h2>
      <p className="muted">
        소유자만 계정을 추가·해제할 수 있습니다. 등록된 관리자는 설문 문항과
        응답 접수 설정을 변경할 수 있습니다.
      </p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {accounts.map((a) => (
          <li
            key={a.email}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 0',
              flexWrap: 'wrap',
            }}
          >
            <span>
              {a.email}
              {a.owner ? ' · 소유자' : ''}
            </span>
            {!a.owner && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => change('revoke', a.email)}
              >
                관리자 권한 해제
              </button>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change('grant', email);
        }}
      >
        <label htmlFor="admin-email">추가할 팀원의 ChatGPT 로그인 이메일</label>
        <input
          id="admin-email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #cddbd6',
            borderRadius: 8,
          }}
        />
        <button
          className="primary"
          style={{ marginTop: 14 }}
          disabled={busy || !email.trim()}
        >
          관리자 추가
        </button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <details>
        <summary>비공개 사이트의 팀원 접근 방법</summary>
        <ol>
          <li>이 화면에서 이메일을 관리자 계정으로 추가합니다.</li>
          <li>
            Sites의 이 사이트 공유 설정에서 같은 이메일을 방문자로 허용합니다.
            사이트를 전체 공개할 필요는 없습니다.
          </li>
          <li>
            팀원은 허용된 이메일의 ChatGPT 계정으로 로그인한 뒤 이 관리자 주소에
            접속합니다.
          </li>
        </ol>
        <p className="muted">
          이 화면의 관리자 권한과 사이트 공유 설정은 별개입니다. 구글 응답
          스프레드시트 열람 권한도 Google에서 별도로 공유해주세요.
        </p>
      </details>
    </section>
  );
}
