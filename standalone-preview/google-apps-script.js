/**
 * 베베숲 고객 경험 & 브랜드 전환 설문조사 Google Apps Script
 * 완전 자동화 대시보드 & CRM 엔진 (2026 최신 개정판 - 6대 핵심 테마 & 동적 질문 연동)
 * 스프레드시트 ID: 1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s
 */

const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';

// 📌 통합 관리 4대 핵심 시트명
const DASHBOARD_SHEET = '📊 베베숲_인사이트_대시보드';
const INTERVIEW_SHEET = '🎙️ 1대1_심층인터뷰_대상자';
const VOC_SHEET = '💬 고객_생생의견_VOC';
const RAW_DATA_SHEET = '📋 전체_응답_데이터';

const ALLOWED_SHEETS = [
  DASHBOARD_SHEET,
  INTERVIEW_SHEET,
  VOC_SHEET,
  RAW_DATA_SHEET
];

// 테마별 브랜드 컬러 매핑 (6개 대주제)
const SECTION_COLORS = [
  '#087768', // 1. 나의 물티슈 사용 (Bebesup Green)
  '#0284C7', // 2. 사용 제품 & 구매 채널 (Sky Blue)
  '#D97706', // 3. 물티슈 선택 경험 (Amber)
  '#7C3AED', // 4. 베베숲 이용 경험 (Deep Violet)
  '#059669', // 5. 물티슈 너머 & 신제품 제언 (Emerald)
  '#DB2777'  // 6. 경품 응모 & 인터뷰 신청 (Rose Pink)
];

const SECTION_ICONS = ['🎯', '🔄', '🔍', '🌿', '🚀', '🎁'];

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

// 🌐 실시간 라이브 설문에서 최신 질문과 섹션 목록을 자동으로 가져오는 함수 (비주얼 에디터 변경 실시간 동기화)
function getSurveyData() {
  try {
    const url = 'https://bebesup-survey.netlify.app/questions-data.js?v=' + new Date().getTime();
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const text = res.getContentText();
    const qMatch = text.match(/const SURVEY_QUESTIONS\s*=\s*(\[[\s\S]*?\n\]);/);
    const sMatch = text.match(/const SECTION_TITLES\s*=\s*(\[[\s\S]*?\n\]);/);
    const questions = qMatch ? JSON.parse(qMatch[1]) : [];
    const sections = sMatch ? JSON.parse(sMatch[1]) : [
      '나의 물티슈 사용',
      '사용 제품 & 구매 채널',
      '물티슈 선택 경험',
      '베베숲 이용 경험',
      '물티슈 너머 & 신제품 제언',
      '경품 응모 & 인터뷰 신청'
    ];
    if (questions.length > 0) {
      return { questions, sections };
    }
  } catch (err) {
    Logger.log('Netlify 질문 로드 오류: ' + err.message);
  }
  return {
    questions: [],
    sections: [
      '나의 물티슈 사용',
      '사용 제품 & 구매 채널',
      '물티슈 선택 경험',
      '베베숲 이용 경험',
      '물티슈 너머 & 신제품 제언',
      '경품 응모 & 인터뷰 신청'
    ]
  };
}

/**
 * 📌 [사람이 읽기 쉬운 직관적 헤더 생성]
 * 질문당 1개 컬럼에 선택한 답변들을 깔끔한 콤마(,) 구분 텍스트로 저장
 */
function buildHeaders(questions) {
  const headers = ['No', '응답ID', '제출일시', '고객유형'];
  for (const q of questions) {
    headers.push('[' + q.id + '] ' + q.title);
    if (q.options && q.options.some(o => o.includes('기타'))) {
      headers.push('[' + q.id + '_기타]');
    }
  }
  return headers;
}

/**
 * 🧹 [불필요/레거시 시트 자동 정리 함수]
 */
function cleanupLegacySheets(book) {
  const allSheets = book.getSheets();
  for (let i = 0; i < allSheets.length; i++) {
    const sheet = allSheets[i];
    const name = sheet.getName();
    if (!ALLOWED_SHEETS.includes(name)) {
      try {
        book.deleteSheet(sheet);
        Logger.log('불필요한 레거시 시트 삭제 완료: ' + name);
      } catch (e) {
        Logger.log('시트 삭제 건너뜀 (' + name + '): ' + e.message);
      }
    }
  }
}

/**
 * 🚀 [전체 시트 초기화 및 통합 대시보드 구축 메인 함수]
 * 질문이 변경되거나 추가되어도 100% 동적으로 대시보드와 원본 시트를 재구축합니다.
 */
function resetAndSetupFresh() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  const surveyData = getSurveyData();
  const questions = surveyData.questions;
  const sections = surveyData.sections;

  if (!questions || questions.length === 0) {
    throw new Error('최신 설문 질문을 불러오지 못했습니다. 네트워크 상태를 확인해주세요.');
  }

  // 1. 필수 4대 시트 먼저 생성/확보
  const dashSheet = getOrCreate(book, DASHBOARD_SHEET);
  const interviewSheet = getOrCreate(book, INTERVIEW_SHEET);
  const vocSheet = getOrCreate(book, VOC_SHEET);
  const rawSheet = getOrCreate(book, RAW_DATA_SHEET);

  // 2. 불필요한 레거시 시트 자동 삭제
  cleanupLegacySheets(book);

  // 3. 탭 순서 및 탭 컬러 지정
  book.setActiveSheet(dashSheet);
  book.moveActiveSheet(1);
  dashSheet.setTabColor('#087768');

  book.setActiveSheet(interviewSheet);
  book.moveActiveSheet(2);
  interviewSheet.setTabColor('#2563EB');

  book.setActiveSheet(vocSheet);
  book.moveActiveSheet(3);
  vocSheet.setTabColor('#D97706');

  book.setActiveSheet(rawSheet);
  book.moveActiveSheet(4);
  rawSheet.setTabColor('#64748B');

  // 4. [📋 전체_응답_데이터] 시트 초기화 (보기 편한 직관적 컬럼 구조)
  rawSheet.clear();
  const headers = buildHeaders(questions);
  if (rawSheet.getMaxColumns() < headers.length) {
    rawSheet.insertColumnsAfter(rawSheet.getMaxColumns(), headers.length - rawSheet.getMaxColumns());
  }
  rawSheet.getRange(1, 1, 1, headers.length).setValues([headers.map(safe)]);
  rawSheet.setFrozenRows(1);
  const rawHeader = rawSheet.getRange(1, 1, 1, headers.length);
  rawHeader.setBackground('#087768').setFontColor('#ffffff').setFontWeight('bold').setFontSize(9);
  
  rawSheet.setColumnWidth(1, 45);   // No
  rawSheet.setColumnWidth(2, 130);  // 응답ID
  rawSheet.setColumnWidth(3, 130);  // 제출일시
  rawSheet.setColumnWidth(4, 130);  // 고객유형
  for (let c = 5; c <= headers.length; c++) {
    rawSheet.setColumnWidth(c, 240); // 질문별 컬럼 너비 넉넉하게 세팅
  }

  // 5. [🎙️ 1대1_심층인터뷰_대상자] 시트 초기화
  interviewSheet.clear();
  const intHeaders = [
    'No', '제출일시', '고객유형', '성함 (Q25)', '휴대전화 번호 (Q26)',
    'NPS 점수', '현재 사용제품 (Q14)', '베베숲 정착이유 (Q6)',
    '사용 중 아쉬운점 (Q17)', '베베숲에 바라는 점 (Q23)', '진행 상태', '담당자 메모'
  ];
  if (interviewSheet.getMaxColumns() < intHeaders.length) {
    interviewSheet.insertColumnsAfter(interviewSheet.getMaxColumns(), intHeaders.length - interviewSheet.getMaxColumns());
  }
  interviewSheet.getRange(1, 1, 1, intHeaders.length).setValues([intHeaders]);
  interviewSheet.setFrozenRows(1);
  const intHeader = interviewSheet.getRange(1, 1, 1, intHeaders.length);
  intHeader.setBackground('#1E3A8A').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
  interviewSheet.setColumnWidth(1, 45);
  interviewSheet.setColumnWidth(2, 130);
  interviewSheet.setColumnWidth(3, 130);
  interviewSheet.setColumnWidth(4, 90);
  interviewSheet.setColumnWidth(5, 125);
  interviewSheet.setColumnWidth(6, 85);
  interviewSheet.setColumnWidth(7, 160);
  interviewSheet.setColumnWidth(8, 200);
  interviewSheet.setColumnWidth(9, 200);
  interviewSheet.setColumnWidth(10, 260);
  interviewSheet.setColumnWidth(11, 110);
  interviewSheet.setColumnWidth(12, 220);

  // 진행 상태 드롭다운 유효성 검사 규칙 적용 (100개 행)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['대기(미접촉)', '연락완료', '인터뷰확정', '인터뷰완료', '부재/거절'], true)
    .setAllowInvalid(false)
    .build();
  interviewSheet.getRange(2, 11, 100, 1).setDataValidation(statusRule);

  // 6. [💬 고객_생생의견_VOC] 시트 초기화
  vocSheet.clear();
  const vocHeaders = [
    'No', '제출일시', '고객유형', 'NPS점수',
    '현재 사용 베베숲 제품 (Q14)', '비교/혼동했던 제품 (Q15)',
    '추천/비추천 이유 (Q19)', '타사 세제/스킨케어 고집 이유 (Q20)', '베베숲에 바라는 점 & 신제품 제언 (Q23)'
  ];
  if (vocSheet.getMaxColumns() < vocHeaders.length) {
    vocSheet.insertColumnsAfter(vocSheet.getMaxColumns(), vocHeaders.length - vocSheet.getMaxColumns());
  }
  vocSheet.getRange(1, 1, 1, vocHeaders.length).setValues([vocHeaders]);
  vocSheet.setFrozenRows(1);
  const vocHeader = vocSheet.getRange(1, 1, 1, vocHeaders.length);
  vocHeader.setBackground('#D97706').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
  vocSheet.setColumnWidth(1, 45);
  vocSheet.setColumnWidth(2, 130);
  vocSheet.setColumnWidth(3, 130);
  vocSheet.setColumnWidth(4, 80);
  vocSheet.setColumnWidth(5, 180);
  vocSheet.setColumnWidth(6, 220);
  vocSheet.setColumnWidth(7, 260);
  vocSheet.setColumnWidth(8, 260);
  vocSheet.setColumnWidth(9, 360);

  // 7. [📊 베베숲_인사이트_대시보드] 전체 6대 대주제 및 모든 문항 동적 렌더링
  refreshDashboard(book, questions, sections);

  book.setActiveSheet(dashSheet);
  Logger.log('🎉 통합 대시보드(전체 문항 세부 인사이트 엔진) 개편이 완료되었습니다!');
}

/**
 * 📊 [대시보드 렌더링 및 6대 대주제 전체 문항 자동 계산 함수]
 * 질문이 변경되거나 보기가 추가/수정되어도 100% 자동으로 반영됩니다.
 */
function refreshDashboard(book, questions, sections) {
  const dashSheet = getOrCreate(book, DASHBOARD_SHEET);
  const rawSheet = getOrCreate(book, RAW_DATA_SHEET);

  let qList = questions;
  let secList = sections;
  if (!qList || qList.length === 0) {
    const data = getSurveyData();
    qList = data.questions;
    secList = data.sections;
  }

  dashSheet.clear();

  // 기본 컬럼 너비 세팅
  dashSheet.setColumnWidth(1, 60);   // A: 순위
  dashSheet.setColumnWidth(2, 360);  // B: 항목명 (선택지)
  dashSheet.setColumnWidth(3, 85);   // C: 응답수
  dashSheet.setColumnWidth(4, 90);   // D: 비율
  dashSheet.setColumnWidth(5, 230);  // E: 시각화 바 차트
  dashSheet.setColumnWidth(6, 110);  // F: 비고
  dashSheet.setColumnWidth(7, 110);  // G: 비고

  // 원본 데이터 집계
  const lastRow = rawSheet.getLastRow();
  const totalCount = lastRow > 1 ? lastRow - 1 : 0;

  let npsScore = 0;
  let avgRating = '0.0';
  let interviewCount = 0;
  let prizeCount = 0;
  let rows = [];
  let headers = [];
  let findCol = () => -1;

  if (totalCount > 0) {
    const rawData = rawSheet.getDataRange().getValues();
    headers = rawData[0].map(String);
    rows = rawData.slice(1);
    findCol = qId => headers.findIndex(h => h.startsWith('[' + qId + ']') || h === qId);

    // Q18 추천 점수 분석
    const npsIdx = findCol('Q18');
    if (npsIdx >= 0) {
      const scores = rows.map(r => Number(r[npsIdx])).filter(n => Number.isFinite(n) && n >= 0 && n <= 10);
      if (scores.length > 0) {
        const promoters = scores.filter(n => n >= 9).length;
        const detractors = scores.filter(n => n <= 6).length;
        npsScore = Math.round(((promoters - detractors) / scores.length) * 100);
        avgRating = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      }
    }

    // 인터뷰 신청자 (Q24-interview)
    const intIdx = findCol('Q24-interview');
    if (intIdx >= 0) {
      interviewCount = rows.filter(r => String(r[intIdx] || '').includes('네') || String(r[intIdx] || '').includes('참여')).length;
    }

    // 경품 응모자 (Q27-agree)
    const prizeIdx = findCol('Q27-agree');
    if (prizeIdx >= 0) {
      prizeCount = rows.filter(r => String(r[prizeIdx] || '').includes('동의')).length;
    }
  }

  const interviewRate = totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0;
  const prizeRate = totalCount > 0 ? Math.round((prizeCount / totalCount) * 100) : 0;

  // 1. 헤더 메인 타이틀 배너
  dashSheet.getRange('A1:G1').merge();
  dashSheet.getRange('A1').setValue('🌿 베베숲(Bebesup) 고객 경험 & 브랜드 전환 통합 인사이트 대시보드');
  dashSheet.getRange('A1').setBackground('#087768').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center').setVerticalAlignment('middle');
  dashSheet.setRowHeight(1, 46);

  // 2. 부제목 / 갱신 일시
  dashSheet.getRange('A2:G2').merge();
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  dashSheet.getRange('A2').setValue('최근 데이터 갱신: ' + nowStr + ' (KST)  |  실시간 설문 연동: https://bebesup-survey.netlify.app');
  dashSheet.getRange('A2').setFontColor('#64748B').setFontSize(9).setHorizontalAlignment('center');
  dashSheet.setRowHeight(2, 22);
  dashSheet.setRowHeight(3, 12);

  // 3. 4대 핵심 KPI 요약 카드 (행 4~6)
  // 카드 1: 총 응답자 수
  dashSheet.getRange('A4:B4').merge().setValue('총 설문 응답자');
  dashSheet.getRange('A5:B5').merge().setValue(totalCount + ' 건');
  dashSheet.getRange('A6:B6').merge().setValue('실시간 누적 응답');
  styleCard(dashSheet, 'A4:B6', '#087768', '#F0FDF4');

  // 카드 2: NPS 점수
  dashSheet.getRange('C4').setValue('NPS (순추천지수)');
  dashSheet.getRange('C5').setValue((npsScore >= 0 ? '+' : '') + npsScore + ' 점');
  dashSheet.getRange('C6').setValue('추천(9-10) - 비추천(0-6)');
  styleCard(dashSheet, 'C4:C6', npsScore >= 0 ? '#059669' : '#DC2626', '#F8FAFC');

  // 카드 3: 평균 추천 평점
  dashSheet.getRange('D4').setValue('추천 평균 평점');
  dashSheet.getRange('D5').setValue(avgRating + ' / 10점');
  dashSheet.getRange('D6').setValue('10점 만점 기준');
  styleCard(dashSheet, 'D4:D6', '#087768', '#F8FAFC');

  // 카드 4: 1:1 심층 인터뷰 신청
  dashSheet.getRange('E4:F4').merge().setValue('심층 인터뷰 신청자');
  dashSheet.getRange('E5:F5').merge().setValue(interviewCount + ' 명 (' + interviewRate + '%)');
  dashSheet.getRange('E6:F6').merge().setValue('1:1 심층 인터뷰 후보군');
  styleCard(dashSheet, 'E4:F6', '#2563EB', '#EFF6FF');

  // 카드 5: 경품 응모 완료
  dashSheet.getRange('G4').setValue('경품 응모율');
  dashSheet.getRange('G5').setValue(prizeCount + ' 명 (' + prizeRate + '%)');
  dashSheet.getRange('G6').setValue('개인정보 수집 동의 완료');
  styleCard(dashSheet, 'G4:G6', '#D97706', '#FEF3C7');

  dashSheet.setRowHeight(4, 24);
  dashSheet.setRowHeight(5, 38);
  dashSheet.setRowHeight(6, 20);
  dashSheet.setRowHeight(7, 18);

  // 4. 전체 6대 대주제(섹션) 및 각 섹션별 객관식 문항 동적 렌더링
  let currentRow = 8;

  for (let secIdx = 0; secIdx < secList.length; secIdx++) {
    const secTitle = secList[secIdx];
    const secThemeColor = SECTION_COLORS[secIdx % SECTION_COLORS.length];
    const secIcon = SECTION_ICONS[secIdx % SECTION_ICONS.length];

    // 해당 섹션에 속한 객관식/점수 문항 필터링
    const secQuestions = qList.filter(q => q.section === secIdx && (q.type === 'single' || q.type === 'multi' || q.type === 'score'));
    if (secQuestions.length === 0) continue;

    // 대주제 섹션 배너 (구분선)
    dashSheet.getRange(currentRow, 1, 1, 7).merge();
    dashSheet.getRange(currentRow, 1).setValue(secIcon + ' [대주제 ' + (secIdx + 1) + '] ' + secTitle)
      .setBackground(secThemeColor)
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(12)
      .setVerticalAlignment('middle');
    dashSheet.setRowHeight(currentRow, 36);
    currentRow++;

    // 해당 섹션 내 각 문항별 통계 테이블 렌더링
    for (let qIdx = 0; qIdx < secQuestions.length; qIdx++) {
      const q = secQuestions[qIdx];
      currentRow = renderQuestionTable(dashSheet, currentRow, {
        q: q,
        color: secThemeColor,
        rows: rows,
        totalCount: totalCount,
        findCol: findCol
      });
    }

    // 대주제 간 여백
    dashSheet.setRowHeight(currentRow, 18);
    currentRow++;
  }
}

function styleCard(sheet, rangeA1, valColor, bgColor) {
  const range = sheet.getRange(rangeA1);
  range.setBackground(bgColor);
  range.setBorder(true, true, true, true, false, false, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
  
  const topCell = range.getCell(1, 1);
  topCell.setFontSize(10).setFontWeight('bold').setFontColor('#475569').setHorizontalAlignment('center');

  const midCell = range.getCell(2, 1);
  midCell.setFontSize(18).setFontWeight('bold').setFontColor(valColor).setHorizontalAlignment('center');

  const botCell = range.getCell(3, 1);
  botCell.setFontSize(8).setFontColor('#94A3B8').setHorizontalAlignment('center');
}

/**
 * 📌 [단일 문항 통계 테이블 동적 생성 함수]
 * 질문 내용, 선택지 목록, 응답수, 비율, 막대 그래프를 자동 생성합니다.
 */
function renderQuestionTable(sheet, startRow, cfg) {
  const { q, color, rows, totalCount, findCol } = cfg;

  // 문항 타이틀 바
  sheet.getRange(startRow, 1, 1, 7).merge();
  const qTypeBadge = q.type === 'multi' ? ' [복수선택]' : (q.type === 'score' ? ' [10점 만점 평가]' : ' [단일선택]');
  sheet.getRange(startRow, 1).setValue('▶ [' + q.id + '] ' + q.title + qTypeBadge)
    .setBackground('#F8FAFC')
    .setFontColor('#1E293B')
    .setFontWeight('bold')
    .setFontSize(10)
    .setVerticalAlignment('middle');
  sheet.setRowHeight(startRow, 28);

  // 테이블 헤더
  const tableHeaders = ['순위', '선택지 항목', '응답수', '비율', '시각화 그래프 (비율)', '', ''];
  sheet.getRange(startRow + 1, 1, 1, 7).setValues([tableHeaders]);
  sheet.getRange(startRow + 1, 1, 1, 7)
    .setBackground('#F1F5F9')
    .setFontColor('#475569')
    .setFontWeight('bold')
    .setFontSize(9)
    .setHorizontalAlignment('center');
  sheet.setRowHeight(startRow + 1, 22);

  // 보기 목록 준비 (Q18 점수 문항은 등급 및 0~10점 옵션 자동 생성)
  let options = [];
  if (q.type === 'score') {
    options = [
      '추천 고객 (9~10점)',
      '중립 고객 (7~8점)',
      '비추천 고객 (0~6점)',
      '10점', '9점', '8점', '7점', '6점', '5점', '4점', '3점', '2점', '1점', '0점'
    ];
  } else {
    options = Array.isArray(q.options) ? q.options.slice() : [];
  }

  // 옵션별 데이터 집계
  const stats = options.map(opt => {
    let count = 0;
    if (totalCount > 0) {
      const col = findCol(q.id);
      if (col >= 0) {
        if (q.type === 'score') {
          const scores = rows.map(r => Number(r[col])).filter(n => Number.isFinite(n) && n >= 0 && n <= 10);
          if (opt.startsWith('추천')) count = scores.filter(n => n >= 9).length;
          else if (opt.startsWith('중립')) count = scores.filter(n => n >= 7 && n <= 8).length;
          else if (opt.startsWith('비추천')) count = scores.filter(n => n <= 6).length;
          else {
            const targetScore = parseInt(opt, 10);
            count = scores.filter(n => n === targetScore).length;
          }
        } else if (q.type === 'multi') {
          count = rows.filter(r => {
            const val = String(r[col] || '');
            return val.split(',').map(s => s.trim()).includes(String(opt).trim());
          }).length;
        } else {
          count = rows.filter(r => String(r[col] || '').trim() === String(opt).trim()).length;
        }
      }
    }
    const rate = totalCount > 0 ? (count / totalCount) : 0;
    return { opt, count, rate };
  });

  // 일반 객관식은 응답수 내림차순 정렬 (점수 문항은 순서 유지)
  if (q.type !== 'score') {
    stats.sort((a, b) => b.count - a.count);
  }

  // 행 채우기
  const dataRows = stats.map((item, idx) => {
    return [
      idx + 1,
      item.opt,
      item.count,
      item.rate,
      '', // E열은 SPARKLINE 수식으로 채움
      '',
      ''
    ];
  });

  if (dataRows.length > 0) {
    const dataRange = sheet.getRange(startRow + 2, 1, dataRows.length, 7);
    dataRange.setValues(dataRows);
    dataRange.setFontSize(9).setVerticalAlignment('middle');

    // A열(순위), C열(응답수) 가운데 정렬
    sheet.getRange(startRow + 2, 1, dataRows.length, 1).setHorizontalAlignment('center');
    sheet.getRange(startRow + 2, 3, dataRows.length, 1).setHorizontalAlignment('center');

    // D열(비율) 퍼센트 포맷
    const rateRange = sheet.getRange(startRow + 2, 4, dataRows.length, 1);
    rateRange.setNumberFormat('0.0%').setHorizontalAlignment('right');

    // E열 SPARKLINE 수식 적용
    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = startRow + 2 + i;
      const rateVal = stats[i].rate;
      if (rateVal > 0) {
        sheet.getRange(rowNum, 5).setFormula(
          '=SPARKLINE(D' + rowNum + ', {"charttype", "bar"; "max", 1; "color1", "' + color + '"})'
        );
      } else {
        sheet.getRange(rowNum, 5).setValue('-');
      }
    }

    // 테두리 및 줄무늬 스타일링
    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = startRow + 2 + i;
      sheet.setRowHeight(rowNum, 21);
      if (i % 2 === 1) {
        sheet.getRange(rowNum, 1, 1, 7).setBackground('#F8FAFC');
      }
    }
  }

  // 문항 간 얇은 공백
  const nextRow = startRow + 2 + dataRows.length;
  sheet.setRowHeight(nextRow, 12);
  return nextRow + 1;
}

/**
 * 📌 [설문 응답 실시간 수신 웹훅 함수]
 * 라이브 설문에서 응답 제출 시 모든 시트와 대시보드를 100% 실시간 갱신합니다.
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

    const rawSheet = getOrCreate(book, RAW_DATA_SHEET);
    const interviewSheet = getOrCreate(book, INTERVIEW_SHEET);
    const vocSheet = getOrCreate(book, VOC_SHEET);

    // 중복 제출 방지 (동일 응답 ID)
    if (rawSheet.getLastRow() > 1 && rawSheet.getRange(2, 2, rawSheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()) {
      return json({ ok: true, id: data.id });
    }

    const surveyData = getSurveyData();
    const questions = Array.isArray(data.questions) && data.questions.length > 0 ? data.questions : surveyData.questions;
    const sections = surveyData.sections;
    const customerType = data.answers.Q13 || (Array.isArray(data.answers.Q1) ? data.answers.Q1.join(', ') : data.answers.Q1) || '';
    const submittedAt = data.submittedAt || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    // 1. [📋 전체_응답_데이터] 사람이 읽기 쉬운 단일 행 조립
    const nextRowNo = Math.max(1, rawSheet.getLastRow());
    const rawRow = [
      nextRowNo,
      data.id,
      submittedAt,
      customerType
    ];

    for (const q of questions) {
      const v = data.answers[q.id];
      let answerText = '';
      if (Array.isArray(v)) {
        answerText = v.join(', ');
      } else if (v !== null && v !== undefined) {
        answerText = String(v);
      }
      rawRow.push(safe(answerText));

      if (q.options && q.options.some(o => o.includes('기타'))) {
        rawRow.push(safe(data.answers[q.id + '_other'] || ''));
      }
    }

    rawSheet.getRange(rawSheet.getLastRow() + 1, 1, 1, rawRow.length).setValues([rawRow]);

    // 2. [🎙️ 1대1_심층인터뷰_대상자] 자동 적재 (Q24 참여 의향 '네'인 경우)
    const interviewAgree = String(data.answers['Q24-interview'] || '');
    if (interviewAgree.includes('네') || interviewAgree.includes('참여')) {
      const intNextRow = Math.max(2, interviewSheet.getLastRow() + 1);
      const intIndex = intNextRow - 1;
      const intRow = [
        intIndex,
        submittedAt,
        customerType,
        data.answers['Q25-name'] || '',
        data.answers['Q26-phone'] || '',
        data.answers['Q18'] !== undefined ? data.answers['Q18'] : '',
        data.answers['Q14'] || '',
        data.answers['Q6'] || '',
        Array.isArray(data.answers['Q17']) ? data.answers['Q17'].join(', ') : (data.answers['Q17'] || ''),
        data.answers['Q23'] || '',
        '대기(미접촉)',
        ''
      ];
      interviewSheet.getRange(intNextRow, 1, 1, intRow.length).setValues([intRow.map(safe)]);
    }

    // 3. [💬 고객_생생의견_VOC] 자동 적재 (주관식 답변이 있는 경우)
    const hasVoc = data.answers['Q14'] || data.answers['Q15'] || data.answers['Q19'] || data.answers['Q20'] || data.answers['Q20-adult'] || data.answers['Q23'];
    if (hasVoc) {
      const vocNextRow = Math.max(2, vocSheet.getLastRow() + 1);
      const vocIndex = vocNextRow - 1;
      const vocRow = [
        vocIndex,
        submittedAt,
        customerType,
        data.answers['Q18'] !== undefined ? data.answers['Q18'] : '',
        data.answers['Q14'] || '',
        data.answers['Q15'] || '',
        data.answers['Q19'] || '',
        data.answers['Q20'] || data.answers['Q20-adult'] || '',
        data.answers['Q23'] || ''
      ];
      vocSheet.getRange(vocNextRow, 1, 1, vocRow.length).setValues([vocRow.map(safe)]);
    }

    SpreadsheetApp.flush();

    // 4. [📊 대시보드] 전체 6대 대주제 및 모든 통계 실시간 자동 갱신
    refreshDashboard(book, questions, sections);

    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
