export function appsScript(secret: string = '') {
  return `// 베베숲 고객 경험 설문 Google Apps Script (2026 최신 31개 문항 완벽 지원)
const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
const SECRET = ${JSON.stringify(secret)};
const RESPONSE_SHEET = '베베숲_응답';
const DICTIONARY_SHEET = '베베숲_문항사전';
const SUMMARY_SHEET = '베베숲_분석_종합';
const DETAIL_SHEET = '베베숲_응답_상세';

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function safe(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  const s = String(value);
  return /^0[0-9]+$/.test(s) || /^[=+@\\-\\t\\r\\n]/.test(s) ? "'" + s : s;
}

function getOrCreate(book, name) {
  return book.getSheetByName(name) || book.insertSheet(name);
}

function doPost(e) {
  let lock;
  try {
    const data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret && data.secret !== SECRET) return json({ ok: false, error: 'Unauthorized' });
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.action === 'ping') return json({ ok: true, spreadsheetId: book.getId() });

    if (data.action === 'refreshAnalysis' && Array.isArray(data.questions)) {
      refreshAnalysis(book, data.questions);
      return json({ ok: true });
    }

    if (data.action !== 'submit' || !data.id || !Array.isArray(data.questions)) return json({ ok: false });

    lock = LockService.getScriptLock();
    lock.waitLock(20000);

    const sheet = getOrCreate(book, RESPONSE_SHEET);

    // 중복 제출 방지 (동일 응답 ID)
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()) {
      return json({ ok: true, id: data.id });
    }

    const customerType = data.answers.Q13 || (Array.isArray(data.answers.Q1) ? data.answers.Q1.join(', ') : data.answers.Q1) || '';
    const values = {
      '응답ID': data.id,
      '제출일시': data.submittedAt || new Date().toISOString(),
      '설문버전': data.version || '20261111',
      '고객유형': customerType
    };

    for (const q of data.questions) {
      const v = data.answers[q.id];
      values[q.id] = Array.isArray(v) ? JSON.stringify(v) : (q.type === 'score' && v !== undefined ? Number(v) : (v ?? ''));
      values[q.id + '_기타'] = data.answers[q.id + '_other'] || '';
      if (q.type === 'multi' && Array.isArray(q.options)) {
        for (const option of q.options) {
          values[q.id + ' | ' + option] = (v === undefined || !Array.isArray(v)) ? '' : (v.includes(option) ? 1 : 0);
        }
      }
    }

    let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    for (const key of Object.keys(values)) {
      if (!headers.includes(key)) headers.push(key);
    }
    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers.map(safe)]);
    sheet.setFrozenRows(1);

    // 문항 사전 업데이트
    const dictionary = getOrCreate(book, DICTIONARY_SHEET);
    if (!dictionary.getLastRow()) {
      dictionary.appendRow(['설문버전', '문항번호', '질문', '유형', '선택지']);
      dictionary.setFrozenRows(1);
    }
    const versionStr = String(data.version || '20261111');
    const known = dictionary.getLastRow() > 1 ? dictionary.getRange(2, 1, dictionary.getLastRow() - 1, 1).createTextFinder(versionStr).matchEntireCell(true).findNext() : null;
    if (!known) {
      const rows = data.questions.map(q => [versionStr, q.id, q.title, q.type, JSON.stringify(q.options || [])].map(safe));
      dictionary.getRange(dictionary.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
    }

    // 응답 행 삽입
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([headers.map(h => safe(values[h] ?? ''))]);
    SpreadsheetApp.flush();

    // 분석 종합 시트 자동 갱신
    refreshAnalysis(book, data.questions);
    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function refreshAnalysis(book, questions) {
  const source = book.getSheetByName(RESPONSE_SHEET);
  const summary = getOrCreate(book, SUMMARY_SHEET);
  const detail = getOrCreate(book, DETAIL_SHEET);

  summary.clearContents();
  detail.clearContents();

  if (!source || source.getLastRow() < 2) {
    summary.getRange(1, 1, 2, 2).setValues([['지표', '값'], ['총 응답 수', 0]]);
    return;
  }

  const data = source.getDataRange().getValues();
  const headers = data[0].map(String);
  const rows = data.slice(1);
  const find = name => headers.indexOf(name);
  const count = rows.length;

  // NPS 추천 점수 (Q18: 0~10점)
  const npsCol = find('Q18') >= 0 ? find('Q18') : find('Q24');
  const scores = npsCol >= 0 ? rows.map(r => Number(r[npsCol])).filter(n => Number.isFinite(n) && n >= 0 && n <= 10) : [];
  const promoters = scores.filter(n => n >= 9).length;
  const detractors = scores.filter(n => n <= 6).length;
  const nps = scores.length ? Math.round((promoters - detractors) / scores.length * 100) : '';
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : '';

  // 경품 응모 동의 (Q27-agree) & 인터뷰 신청 (Q24-interview)
  const prizeCol = find('Q27-agree') >= 0 ? find('Q27-agree') : find('Q28');
  const interviewCol = find('Q24-interview') >= 0 ? find('Q24-interview') : find('Q31');

  const top = [
    ['지표', '값'],
    ['총 응답 수', count],
    ['NPS (순추천지수)', nps],
    ['평균 추천 점수', avgScore],
    ['경품 추첨 동의', countContains(rows, prizeCol, '동의')],
    ['심층 인터뷰 참여 신청', countContains(rows, interviewCol, '참여')],
    [],
    ['문항번호', '질문', '선택지/지표', '응답수', '비율']
  ];

  const stats = [];
  for (const q of questions) {
    if (q.type === 'text' || q.type === 'phone') continue;
    if (!q.options) continue;
    for (const option of q.options) {
      let n = 0;
      if (q.type === 'multi') {
        const col = find(q.id + ' | ' + option);
        if (col >= 0) n = rows.filter(r => Number(r[col]) === 1).length;
      } else {
        const col = find(q.id);
        if (col >= 0) n = rows.filter(r => String(r[col]) === String(option)).length;
      }
      stats.push([q.id, q.title, option, n, count ? Math.round(n / count * 1000) / 10 : 0]);
    }
  }

  const summaryRows = top.concat(stats);
  summary.getRange(1, 1, summaryRows.length, 5).setValues(summaryRows.map(r => {
    const row = r.slice();
    while (row.length < 5) row.push('');
    return row;
  }));
  summary.setFrozenRows(1);
  summary.autoResizeColumns(1, 5);
  if (stats.length) summary.getRange(9, 5, stats.length, 1).setNumberFormat('0.0"%"');

  // 상세 응답 시트 (개인정보 성함/연락처는 개인정보보호를 위해 제외)
  const excluded = new Set(['Q25-name', 'Q26-phone', 'Q29', 'Q34', 'Q35']);
  const detailQuestions = questions.filter(q => !excluded.has(q.id));
  const detailHeaders = ['응답ID', '제출일시', '설문버전', '고객유형'].concat(detailQuestions.map(q => q.id + ' ' + q.title));
  const detailRows = rows.map(row => {
    const base = ['응답ID', '제출일시', '설문버전', '고객유형'].map(h => row[find(h)] ?? '');
    return base.concat(detailQuestions.map(q => {
      const col = find(q.id);
      return col >= 0 ? row[col] : '';
    }));
  });

  detail.getRange(1, 1, 1, detailHeaders.length).setValues([detailHeaders]);
  if (detailRows.length) detail.getRange(2, 1, detailRows.length, detailHeaders.length).setValues(detailRows);
  detail.setFrozenRows(1);
  detail.getRange(1, 1, 1, detailHeaders.length).setWrap(true);
}

function countContains(rows, col, keyword) {
  if (col < 0) return 0;
  return rows.filter(r => String(r[col] || '').includes(keyword)).length;
}

// 경품 지급과 인터뷰 혜택 제공이 모두 끝난 뒤 실행하면 90일 후 연락처와 이름을 자동 파기합니다.
function scheduleContactDeletion() {
  const end = new Date();
  end.setDate(end.getDate() + 90);
  ScriptApp.newTrigger('deleteInterviewContacts').timeBased().at(end).create();
}

function deleteInterviewContacts() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RESPONSE_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (const key of ['Q25-name', 'Q26-phone', 'Q29', 'Q34', 'Q35']) {
    const col = headers.indexOf(key);
    if (col >= 0) sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).clearContent();
  }
}
`;
}
