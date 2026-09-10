'use client';
import { useEffect, useState } from 'react';
type MediaMap = Record<string, { url: string; updatedAt: string }>;
const labels = { product: '제품 사진', background: '배경 이미지' } as const;
export default function MediaManager() {
  const [media, setMedia] = useState<MediaMap>({}),
    [busy, setBusy] = useState(''),
    [message, setMessage] = useState('');
  async function load() {
    const r = await fetch('/api/admin/media');
    if (r.ok) {
      const data = (await r.json()) as { media: MediaMap };
      setMedia(data.media);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function upload(slot: string, file?: File) {
    if (!file) return;
    setBusy(slot);
    setMessage('');
    const form = new FormData();
    form.set('slot', slot);
    form.set('file', file);
    const r = await fetch('/api/admin/media', { method: 'POST', body: form });
    const d = (await r.json()) as { error?: string };
    setBusy('');
    if (!r.ok) {
      setMessage(d.error || '처리하지 못했습니다.');
      return;
    }
    await load();
    setMessage('이미지를 적용했습니다. 설문 미리보기에서 확인해주세요.');
  }
  async function remove(slot: string) {
    setBusy(slot);
    setMessage('');
    const r = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot }),
    });
    const d = (await r.json()) as { error?: string };
    setBusy('');
    if (!r.ok) {
      setMessage(d.error || '처리하지 못했습니다.');
      return;
    }
    await load();
    setMessage('이미지를 삭제했습니다.');
  }
  return (
    <section>
      <h2>설문 이미지 관리</h2>
      <p className="muted">
        제품 사진은 설문 왼쪽 안내 영역에, 배경 이미지는 설문 상단 배경에
        표시됩니다. PNG·JPG·WEBP, 파일당 5MB 이하를 권장합니다.
      </p>
      <div className="media-grid">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((slot) => (
          <article className="media-card" key={slot}>
            <h3>{labels[slot]}</h3>
            <div className="media-preview">
              {media[slot] ? (
                <img src={media[slot].url} alt={`${labels[slot]} 미리보기`} />
              ) : (
                <span>등록된 이미지 없음</span>
              )}
            </div>
            <label className="secondary upload-button">
              {busy === slot ? '처리 중…' : '이미지 선택'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={!!busy}
                onChange={(e) => upload(slot, e.target.files?.[0])}
              />
            </label>
            {media[slot] && (
              <button
                className="secondary"
                disabled={!!busy}
                onClick={() => remove(slot)}
              >
                삭제
              </button>
            )}
          </article>
        ))}
      </div>
      {message && <output className="notice">{message}</output>}
    </section>
  );
}
