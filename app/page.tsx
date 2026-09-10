'use client';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  questions,
  sections,
  visible,
  cleanAnswers,
  validate,
  prizePrivacy,
  interviewPrivacy,
  isValidPhoneNumber,
  formatPhoneNumber,
  type Answers,
} from '@/lib/survey';
export default function Home() {
  const [qs, setQs] = useState(questions),
    [version, setVersion] = useState('1'),
    [a, setA] = useState<Answers>({}),
    [step, setStep] = useState(0),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [id, setId] = useState(''),
    [media, setMedia] = useState<Record<string, { url: string }>>({});
  useEffect(() => {
    setId(crypto.randomUUID());
    fetch('/api/survey')
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d: any) => {
        setQs(d.questions);
        setVersion(d.version);
        setMedia(d.media || {});
        setLoaded(true);
      })
      .catch(() =>
        setError('설문을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'),
      );
  }, []);
  const groups = sections
      .map((_, i) => i)
      .filter((i) => qs.some((q) => q.section === i && visible(q, a))),
    pos = groups.indexOf(step),
    current = qs.filter((q) => q.section === step && visible(q, a));
  const update = (key: string, value: string | string[]) => {
    setA((old) => cleanAnswers(qs, { ...old, [key]: value }));
    setError('');
  };
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'stage_survey_answers',
            description:
              '현재 화면의 설문 답변을 입력합니다. 제출하지 않습니다.',
            inputSchema: {
              type: 'object',
              properties: { answers: { type: 'object' } },
              required: ['answers'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: any) => {
              if (
                !input ||
                !input.answers ||
                typeof input.answers !== 'object' ||
                Array.isArray(input.answers)
              )
                throw Error('answers 객체가 필요합니다.');
              let next = { ...a };
              for (const [key, value] of Object.entries(input.answers)) {
                if (
                  !current.some((q) => q.id === key) ||
                  !(
                    typeof value === 'string' ||
                    (Array.isArray(value) &&
                      value.every((x) => typeof x === 'string'))
                  )
                )
                  throw Error(
                    '현재 표시된 문항과 문자열 답변만 입력할 수 있습니다.',
                  );
                next[key] = value as any;
              }
              next = cleanAnswers(qs, next);
              const problem = validate(current, next);
              if (problem) throw Error(problem);
              setA(next);
              return { staged: Object.keys(input.answers), submitted: false };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [a, step, qs]);
  async function next() {
    const problem = validate(current, a);
    if (problem) {
      setError(problem);
      return;
    }
    if (pos < groups.length - 1) {
      setStep(groups[pos + 1]);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const clean = cleanAnswers(qs, a),
      allProblem = validate(qs, clean);
    if (allProblem) {
      setError(allProblem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, version, answers: clean }),
      });
      const data: any = await r.json();
      if (!r.ok)
        throw Error(data.error || '제출하지 못했습니다. 다시 시도해주세요.');
      setDone(true);
      setA({});
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '연결을 확인하고 다시 시도해주세요.',
      );
    } finally {
      setBusy(false);
    }
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
        </a>
        <span>고객 경험 설문</span>
      </header>
      <main
        className={`shell ${media.background ? 'has-survey-background' : ''}`}
        style={
          media.background
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(243,246,245,.96) 0%, rgba(243,246,245,.92) 38%, rgba(243,246,245,.82) 100%), url(${media.background.url})`,
              }
            : undefined
        }
      >
        <aside>
          <div className="eyebrow">YOUR EXPERIENCE MATTERS</div>
          <h1>
            더 좋은 일상의 시작,
            <br />
            고객님의 이야기에서.
          </h1>
          <p>
            물티슈를 고르고 사용하며 느꼈던
            <br />
            솔직한 경험을 들려주세요.
          </p>
          <div className="side-note">
            약 5분 소요 · 모든 브랜드 사용자 참여 가능
          </div>
          {media.product && (
            <img
              className="survey-product-image"
              src={media.product.url}
              alt="베베숲 제품"
            />
          )}
          <ol className="steps">
            {groups.map((s, i) => (
              <li key={s} className={s === step ? 'active' : ''}>
                {String(i + 1).padStart(2, '0')}　{sections[s]}
              </li>
            ))}
          </ol>
        </aside>
        <section className="paper">
          {done ? (
            <div className="success">
              <div className="eyebrow">THANK YOU</div>
              <h2>
                고객님의 이야기를
                <br />잘 받았습니다.
              </h2>
              <p>
                소중한 의견을 들려주셔서 감사합니다.
                <br />더 나은 제품과 서비스로 보답하겠습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="section-meta">
                <span>
                  {String(pos + 1).padStart(2, '0')} /{' '}
                  {String(groups.length).padStart(2, '0')}
                </span>
                <span>{sections[step]}</span>
              </div>
              <Progress
                value={(pos / Math.max(groups.length, 1)) * 100}
                aria-label="설문 진행률"
              />
              <h2>
                {step === 0 ? (
                  <>
                    평소 물티슈를
                    <br />
                    어떻게 사용하고 계신가요?
                  </>
                ) : (
                  sections[step]
                )}
              </h2>
              {step === 0 && (
                <>
                  <p className="muted">
                    안녕하세요, 베베숲입니다. 현재 베베숲을 사용하지 않거나 다른
                    브랜드를 사용하고 계셔도 참여하실 수 있습니다. 정답은
                    없습니다. 평소 경험과 가장 가까운 답변을 편하게
                    선택해주세요.
                  </p>
                  <div className="benefit-card">
                    <strong>🎁 설문 참여 혜택</strong>
                    <p>
                      설문 참여자 중 50명을 추첨해 경품을 드립니다. 당첨자에게는
                      입력하신 연락처로 개별 안내드립니다.
                    </p>
                    <span>예상 소요 시간 약 5분</span>
                  </div>
                </>
              )}
              {step === 7 && (
                <div className="notice">
                  <strong>🎁 설문에 참여해주셔서 감사합니다</strong>
                  <p>
                    설문에 참여해주신 분 중 50명을 추첨해 경품을 드립니다. 경품
                    추첨을 원하실 때만 연락처를 입력합니다.
                  </p>
                  {a.Q28 === '네, 참여할게요' && (
                    <div className="privacy-copy">{prizePrivacy}</div>
                  )}
                </div>
              )}
              {step === 8 && (
                <div className="notice">
                  <strong>조금 더 자세한 이야기를 들려주실 수 있나요?</strong>
                  <p>
                    약 20~30분 동안 전화 또는 화상으로 이야기하며, 인터뷰 완료
                    시 별도 사례를 드립니다. 인터뷰 참여 여부는 설문 경품 추첨과
                    관계없습니다.
                  </p>
                  {[
                    '네, 참여하고 싶어요',
                    '자세한 내용을 확인한 후 결정하고 싶어요',
                  ].includes(String(a.Q31 ?? '')) && (
                    <div className="privacy-copy">{interviewPrivacy}</div>
                  )}
                </div>
              )}
              {current.map((q) => {
                const v = a[q.id],
                  multiple = q.type === 'multi',
                  other = Array.isArray(v)
                    ? v.some((x) => ['기타', '기타 브랜드'].includes(x))
                    : ['기타', '기타 브랜드'].includes(String(v));
                return (
                  <fieldset key={q.id} disabled={busy}>
                    <legend id={q.id + '-label'}>
                      <small>
                        {q.id}
                        <b>
                          {q.required ? '필수' : '선택'}
                          {q.max
                            ? ` · 최대 ${q.max}개`
                            : multiple
                              ? ' · 복수 선택'
                              : ''}
                        </b>
                      </small>
                      {q.title}
                    </legend>
                    {q.hint && <p className="muted">{q.hint}</p>}
                    {q.type === 'phone' && (
                      <p id="phone-help" className="muted">
                        하이픈 없이 입력해도 괜찮습니다. 입력을 마치면 자동으로
                        정리됩니다. 예: 010-1234-5678
                      </p>
                    )}
                    {q.type === 'text' || q.type === 'phone' ? (
                      q.type === 'phone' ? (
                        <input
                          aria-labelledby={q.id + '-label'}
                          type="tel"
                          autoComplete="tel"
                          inputMode="numeric"
                          aria-describedby="phone-help"
                          onBlur={(e) => {
                            const value = e.target.value;
                            update(q.id, formatPhoneNumber(value));
                            if (value && !isValidPhoneNumber(value))
                              setError(
                                '휴대전화 번호를 확인해주세요. 010 번호는 숫자 11자리로 입력해주세요.',
                              );
                          }}
                          maxLength={20}
                          placeholder="010-0000-0000"
                          value={String(v ?? '')}
                          onChange={(e) => update(q.id, e.target.value)}
                        />
                      ) : (
                        <textarea
                          aria-labelledby={q.id + '-label'}
                          maxLength={3000}
                          placeholder={
                            q.required
                              ? '답변을 입력해주세요.'
                              : '편하게 적어주세요. (선택)'
                          }
                          value={String(v ?? '')}
                          onChange={(e) => update(q.id, e.target.value)}
                        />
                      )
                    ) : multiple ? (
                      <div className="choices">
                        {q.options.map((o) => {
                          const checked = Array.isArray(v) && v.includes(o);
                          return (
                            <label
                              key={o}
                              className={
                                'choice ' + (checked ? 'selected' : '')
                              }
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(check) => {
                                  const old = Array.isArray(v) ? v : [];
                                  if (check && q.max && old.length >= q.max) {
                                    setError(
                                      `${q.id}은 최대 ${q.max}개까지 선택할 수 있습니다.`,
                                    );
                                    return;
                                  }
                                  update(
                                    q.id,
                                    check
                                      ? [...old, o]
                                      : old.filter((x) => x !== o),
                                  );
                                }}
                              />
                              {o}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <RadioGroup
                        aria-labelledby={q.id + '-label'}
                        className={
                          'choices ' + (q.type === 'score' ? 'score' : '')
                        }
                        value={String(v ?? '')}
                        onValueChange={(x) => update(q.id, String(x))}
                      >
                        {q.options.map((o) => (
                          <label
                            className={'choice ' + (v === o ? 'selected' : '')}
                            key={o}
                          >
                            <RadioGroupItem value={o} />
                            {o}
                          </label>
                        ))}
                      </RadioGroup>
                    )}
                    {other && (
                      <input
                        style={{ marginTop: 12 }}
                        aria-label={q.id + ' 기타 내용'}
                        type="text"
                        maxLength={1000}
                        placeholder={
                          v === '기타 브랜드'
                            ? '브랜드명을 적어주세요. (필수)'
                            : '기타 내용을 적어주세요. (선택)'
                        }
                        value={String(a[q.id + '_other'] ?? '')}
                        onChange={(e) =>
                          update(q.id + '_other', e.target.value)
                        }
                      />
                    )}
                  </fieldset>
                );
              })}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <div className="navigation">
                <button
                  className="secondary"
                  disabled={pos <= 0 || busy}
                  onClick={() => {
                    setStep(groups[pos - 1]);
                    setError('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  이전
                </button>
                <button
                  className="primary"
                  disabled={busy || !loaded}
                  onClick={next}
                >
                  {busy
                    ? '제출 중…'
                    : pos === groups.length - 1
                      ? '설문 제출하기'
                      : '다음으로 →'}
                </button>
              </div>
              <p className="muted" style={{ fontSize: 12 }}>
                응답에 따라 다음 질문이 달라집니다. 새로고침하면 작성 중인
                답변이 초기화됩니다.
              </p>
            </>
          )}
        </section>
      </main>
      <footer>
        베베숲 · 고객님의 경험이 더 나은 제품과 서비스를 만듭니다.　
        <a href="/bebesupcxadmin">설문 관리</a>
      </footer>
    </>
  );
}
