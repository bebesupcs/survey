/**
 * 베베숲 고객 경험 설문 Google Apps Script (2026 최신 31개 문항 자동 연동 엔진)
 * 스프레드시트 ID: 1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s
 */

const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
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
  return /^0[0-9]+$/.test(s) || /^[=+@\-\t\r\n]/.test(s) ? "'" + s : s;
}

function getOrCreate(book, name) {
  return book.getSheetByName(name) || book.insertSheet(name);
}

// 🌐 실시간 라이브 설문에서 최신 31개 질문과 보기를 자동으로 가져오는 함수
function getSurveyQuestions() {
  try {
    const url = 'https://bebesup-survey.netlify.app/questions-data.js?v=' + new Date().getTime();
    const res = UrlFetchApp.fetch(url);
    const text = res.getContentText();
    const match = text.match(/const SURVEY_QUESTIONS\s*=\s*(\[[\s\S]*?\n\]);/);
    if (match) {
      return JSON.parse(match[1]);
    }
  } catch (err) {
    Logger.log('Netlify 질문 로드 오류: ' + err.message);
  }
  return [];
}

// 📌 질문 목록으로부터 헤더 컬럼 목록(107개 열)을 자동 생성하는 함수
function buildHeaders(questions) {
  const headers = ['응답ID', '제출일시', '설문버전', '고객유형'];
  for (const q of questions) {
    headers.push(q.id);
    if (q.options && q.options.some(o => o.includes('기타'))) {
      headers.push(q.id + '_기타');
    }
    if (q.type === 'multi' && Array.isArray(q.options)) {
      for (const opt of q.options) {
        headers.push(q.id + ' | ' + opt);
      }
    }
  }
  return headers;
}

/**
 * 🚀 [1초 전체 초기화 및 새 양식 세팅 함수]
 * Apps Script 상단에서 'resetAndSetupFresh'를 선택하고 [▶ 실행]을 누르면
 * 기존 구형 데이터를 전부 지우고 최신 31개 문항 양식으로 즉시 깨끗하게 세팅합니다.
 */
function resetAndSetupFresh() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questions = getSurveyQuestions();

  if (!questions || questions.length === 0) {
    throw new Error('최신 설문 질문을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');
  }

  const headers = buildHeaders(questions);

  // 1. [베베숲_응답] 시트 초기화
  const respSheet = getOrCreate(book, RESPONSE_SHEET);
  respSheet.clear();
  if (respSheet.getMaxColumns() < headers.length) {
    respSheet.insertColumnsAfter(respSheet.getMaxColumns(), headers.length - respSheet.getMaxColumns());
  }
  respSheet.getRange(1, 1, 1, headers.length).setValues([headers.map(safe)]);
  respSheet.setFrozenRows(1);
  const headerRange = respSheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#087768');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  respSheet.autoResizeColumns(1, Math.min(10, headers.length));

  // 2. [베베숲_문항사전] 시트 초기화
  const dictSheet = getOrCreate(book, DICTIONARY_SHEET);
  dictSheet.clear();
  const dictHeaders = ['설문버전', '문항번호', '질문 내용', '문항 유형', '선택지 목록 (JSON)'];
  dictSheet.getRange(1, 1, 1, dictHeaders.length).setValues([dictHeaders]);
  dictSheet.setFrozenRows(1);
  const dictHeaderRange = dictSheet.getRange(1, 1, 1, dictHeaders.length);
  dictHeaderRange.setBackground('#087768');
  dictHeaderRange.setFontColor('#ffffff');
  dictHeaderRange.setFontWeight('bold');
  const dictRows = questions.map(q => [
    '20261111',
    q.id,
    q.title,
    q.type,
    JSON.stringify(q.options || [])
  ]);
  dictSheet.getRange(2, 1, dictRows.length, dictHeaders.length).setValues(dictRows.map(r => r.map(safe)));
  dictSheet.autoResizeColumns(1, 4);
  dictSheet.setColumnWidth(5, 450);

  // 3. [베베숲_분석_종합] 시트 초기화
  refreshAnalysis(book, questions);

  // 4. [베베숲_응답_상세] 시트 초기화
  const detailSheet = getOrCreate(book, DETAIL_SHEET);
  detailSheet.clear();
  const excluded = new Set(['Q25-name', 'Q26-phone']);
  const detailQuestions = questions.filter(q => !excluded.has(q.id));
  const detailHeaders = ['응답ID', '제출일시', '설문버전', '고객유형'].concat(detailQuestions.map(q => q.id + ' ' + q.title));
  if (detailSheet.getMaxColumns() < detailHeaders.length) {
    detailSheet.insertColumnsAfter(detailSheet.getMaxColumns(), detailHeaders.length - detailSheet.getMaxColumns());
  }
  detailSheet.getRange(1, 1, 1, detailHeaders.length).setValues([detailHeaders]);
  detailSheet.setFrozenRows(1);
  const detailHeaderRange = detailSheet.getRange(1, 1, 1, detailHeaders.length);
  detailHeaderRange.setBackground('#087768');
  detailHeaderRange.setFontColor('#ffffff');
  detailHeaderRange.setFontWeight('bold');
  detailSheet.autoResizeColumns(1, 4);

  Logger.log('🎉 전체 4개 탭이 최신 31개 문항 양식으로 깨끗하게 초기화 완료되었습니다!');
}

/**
 * 📌 [설문 응답 실시간 수신 함수]
 * 웹사이트에서 설문을 제출할 때마다 구글 시트에 자동으로 행을 추가하고 종합 분석을 갱신합니다.
 */
function doPost(e) {
  let lock;
  try {
    const data = JSON.parse(e.postData.contents);
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.action === 'ping') return json({ ok: true, spreadsheetId: book.getId() });

    if (data.action !== 'submit' || !data.id) {
      return json({ ok: false, error: 'Invalid payload' });
    }

    lock = LockService.getScriptLock();
    lock.waitLock(20000);

    const sheet = getOrCreate(book, RESPONSE_SHEET);

    // 중복 제출 방지 (동일 응답 ID)
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()) {
      return json({ ok: true, id: data.id });
    }

    const questions = Array.isArray(data.questions) && data.questions.length > 0 ? data.questions : getSurveyQuestions();
    const customerType = data.answers.Q13 || (Array.isArray(data.answers.Q1) ? data.answers.Q1.join(', ') : data.answers.Q1) || '';
    const values = {
      '응답ID': data.id,
      '제출일시': data.submittedAt || new Date().toISOString(),
      '설문버전': data.version || '20261111',
      '고객유형': customerType
    };

    for (const q of questions) {
      const v = data.answers[q.id];
      values[q.id] = Array.isArray(v) ? JSON.stringify(v) : (q.type === 'score' && v !== undefined ? Number(v) : (v ?? ''));
      if (q.options && q.options.some(o => o.includes('기타'))) {
        values[q.id + '_기타'] = data.answers[q.id + '_other'] || '';
      }
      if (q.type === 'multi' && Array.isArray(q.options)) {
        for (const option of q.options) {
          values[q.id + ' | ' + option] = (v === undefined || !Array.isArray(v)) ? '' : (v.includes(option) ? 1 : 0);
        }
      }
    }

    // 헤더 가져오기 및 필요 시 동적 확장
    let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : buildHeaders(questions);
    for (const key of Object.keys(values)) {
      if (!headers.includes(key)) headers.push(key);
    }
    if (sheet.getMaxColumns() < headers.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers.map(safe)]);
    sheet.setFrozenRows(1);

    // 새 응답 행 추가
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([headers.map(h => safe(values[h] ?? ''))]);
    SpreadsheetApp.flush();

    // 분석 종합 시트 자동 갱신
    refreshAnalysis(book, questions);
    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

/**
 * 📌 [분석 종합 탭 자동 갱신 함수]
 */
function refreshAnalysis(book, questions) {
  const source = book.getSheetByName(RESPONSE_SHEET);
  const summary = getOrCreate(book, SUMMARY_SHEET);

  summary.clear();

  const count = (source && source.getLastRow() > 1) ? source.getLastRow() - 1 : 0;
  let nps = '0', avgScore = '0', prizeCount = 0, interviewCount = 0;
  let rows = [], find = () => -1;

  if (count > 0) {
    const data = source.getDataRange().getValues();
    const headers = data[0].map(String);
    rows = data.slice(1);
    find = name => headers.indexOf(name);

    // NPS 점수 (Q18: 0~10점)
    const npsCol = find('Q18') >= 0 ? find('Q18') : find('Q24');
    const scores = npsCol >= 0 ? rows.map(r => Number(r[npsCol])).filter(n => Number.isFinite(n) && n >= 0 && n <= 10) : [];
    const promoters = scores.filter(n => n >= 9).length;
    const detractors = scores.filter(n => n <= 6).length;
    nps = scores.length ? Math.round((promoters - detractors) / scores.length * 100) : '0';
    avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

    // 경품 응모 (Q27-agree) & 인터뷰 신청 (Q24-interview)
    const prizeCol = find('Q27-agree') >= 0 ? find('Q27-agree') : find('Q28');
    const interviewCol = find('Q24-interview') >= 0 ? find('Q24-interview') : find('Q31');
    prizeCount = countContains(rows, prizeCol, '동의');
    interviewCount = countContains(rows, interviewCol, '참여');
  }

  const kpis = [
    ['지표 항목', '분석 결과 값', '비고'],
    ['총 응답 건수', count + '건', '실시간 누적'],
    ['NPS (Q18 순추천지수)', nps + '점', '추천고객(9-10점) - 비추천고객(0-6점) 비율'],
    ['평균 추천 점수 (Q18)', avgScore + '점 / 10점 만점', '전체 응답자 평균'],
    ['경품 추첨 동의율 (Q27)', prizeCount + '명 (' + (count ? Math.round(prizeCount / count * 100) : 0) + '%)', '시그니처 위드 블루 20팩 추첨 대상'],
    ['심층 인터뷰 참여 신청율 (Q24)', interviewCount + '명 (' + (count ? Math.round(interviewCount / count * 100) : 0) + '%)', '1:1 심층 인터뷰 후보군'],
    [],
    ['문항번호', '질문 내용', '선택지 (보기)', '응답수', '응답 비율']
  ];

  const stats = [];
  const qList = Array.isArray(questions) && questions.length > 0 ? questions : getSurveyQuestions();
  for (const q of qList) {
    if (q.type === 'text' || q.type === 'phone') continue;
    if (!q.options) continue;
    for (const option of q.options) {
      let n = 0;
      if (count > 0) {
        if (q.type === 'multi') {
          const col = find(q.id + ' | ' + option);
          if (col >= 0) n = rows.filter(r => Number(r[col]) === 1).length;
        } else {
          const col = find(q.id);
          if (col >= 0) n = rows.filter(r => String(r[col]) === String(option)).length;
        }
      }
      stats.push([q.id, q.title, option, n, count ? (n / count) : 0]);
    }
  }

  const allSummaryRows = kpis.concat(stats);
  summary.getRange(1, 1, allSummaryRows.length, 5).setValues(allSummaryRows.map(r => {
    const row = r.slice();
    while (row.length < 5) row.push('');
    return row;
  }));
  summary.setFrozenRows(1);
  summary.getRange(1, 1, 1, 3).setBackground('#087768').setFontColor('#ffffff').setFontWeight('bold');
  summary.getRange(8, 1, 1, 5).setBackground('#087768').setFontColor('#ffffff').setFontWeight('bold');
  summary.autoResizeColumns(1, 3);
  summary.setColumnWidth(2, 320);
  summary.setColumnWidth(3, 280);
  if (stats.length) {
    summary.getRange(9, 5, stats.length, 1).setNumberFormat('0.0%');
  }
}

function countContains(rows, col, keyword) {
  if (col < 0) return 0;
  return rows.filter(r => String(r[col] || '').includes(keyword)).length;
}
