/**
 * 베베숲 고객 경험 & 브랜드 전환 설문조사 Google Apps Script
 * 통합 대시보드 & CRM 엔진 (2026 최신 개정판 - 사람이 읽기 쉬운 Raw 데이터 구조)
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
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
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

/**
 * 📌 [사람이 읽기 쉬운 1문항 1열 직관적 헤더 생성]
 * 복수선택이라도 0/1 더미 컬럼을 만들지 않고, 질문당 1개 컬럼에 선택한 답변들을
 * 깔끔한 콤마(,) 구분 텍스트로 저장하여 누구나 엑셀/시트에서 바로 읽을 수 있게 합니다.
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
 * 허용된 4대 핵심 시트 외의 모든 낡거나 불필요한 시트(Sheet1, 이전 시트 등)를 자동 삭제합니다.
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
 * Apps Script 상단에서 'resetAndSetupFresh' 선택 후 [▶ 실행] 클릭 시:
 * 1. 불필요하고 후져보이는 구형 시트 일괄 삭제/정리
 * 2. [📊 대시보드], [🎙️ 인터뷰 대상자], [💬 고객 VOC], [📋 전체 원본] 4대 시트 자동 구축
 * 3. 폰트, 열 너비, 브랜드 컬러(#087768) 및 시각화 바 차트 완벽 세팅
 */
function resetAndSetupFresh() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questions = getSurveyQuestions();

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

  // 4. [📋 전체_응답_데이터] 시트 초기화 (보기 편한 50개 컬럼 구조)
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

  // 진행 상태 드롭다운 유효성 검사 규칙 적용 (100개 행 미리 설정)
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

  // 7. [📊 베베숲_인사이트_대시보드] 시트 구축 및 갱신
  refreshDashboard(book, questions);

  // 최종 대시보드 시트 활성화
  book.setActiveSheet(dashSheet);
  Logger.log('🎉 통합 대시보드 및 4대 핵심 시트 개편이 완료되었습니다!');
}

/**
 * 📊 [대시보드 렌더링 및 통계 자동 계산 함수]
 */
function refreshDashboard(book, questions) {
  const dashSheet = getOrCreate(book, DASHBOARD_SHEET);
  const rawSheet = getOrCreate(book, RAW_DATA_SHEET);
  const qList = Array.isArray(questions) && questions.length > 0 ? questions : getSurveyQuestions();

  dashSheet.clear();

  // 기본 컬럼 너비 세팅
  dashSheet.setColumnWidth(1, 60);   // A: 순위
  dashSheet.setColumnWidth(2, 340);  // B: 항목명
  dashSheet.setColumnWidth(3, 85);   // C: 응답수
  dashSheet.setColumnWidth(4, 90);   // D: 비율
  dashSheet.setColumnWidth(5, 220);  // E: 시각화 바 차트
  dashSheet.setColumnWidth(6, 120);  // F: 부가 정보
  dashSheet.setColumnWidth(7, 120);  // G: 부가 정보

  // 데이터 집계
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

  // 1. 헤더 타이틀 배너
  dashSheet.getRange('A1:G1').merge();
  dashSheet.getRange('A1').setValue('🌿 베베숲(Bebesup) 고객 경험 & 브랜드 전환 인사이트 대시보드');
  dashSheet.getRange('A1').setBackground('#087768').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center').setVerticalAlignment('middle');
  dashSheet.setRowHeight(1, 46);

  // 2. 부제목 / 갱신 일시
  dashSheet.getRange('A2:G2').merge();
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  dashSheet.getRange('A2').setValue('최근 데이터 갱신: ' + nowStr + ' (KST)  |  실시간 설문 주소: https://bebesup-survey.netlify.app');
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

  // 4. 세부 통계 섹션 렌더링
  let currentRow = 8;

  // [섹션 1] Q6: 베베숲 정착 및 선택 이유 Top 순위
  currentRow = renderSection(dashSheet, currentRow, {
    title: '🏆 1. 베베숲 정착 및 전환 요인 Top 순위 (Q6: 타사 대비 베베숲을 정착/선택한 이유)',
    qId: 'Q6',
    color: '#087768',
    questions: qList,
    rows: rows,
    totalCount: totalCount,
    findCol: findCol
  });

  // [섹션 2] Q17: 베베숲 사용 중 불편 및 아쉬운 점
  currentRow = renderSection(dashSheet, currentRow, {
    title: '⚠️ 2. 베베숲 사용 중 불편 및 아쉬운 점 (Q17: 이탈 방지를 위한 시급 개선 VOC)',
    qId: 'Q17',
    color: '#E11D48',
    questions: qList,
    rows: rows,
    totalCount: totalCount,
    findCol: findCol
  });

  // [섹션 3] Q21: 신제품 및 카테고리 확장 수용도
  currentRow = renderSection(dashSheet, currentRow, {
    title: '🚀 3. 카테고리 확장 수용도 (Q21: 아기/온가족 스킨케어 및 세제 진출에 대한 반응)',
    qId: 'Q21',
    color: '#0284C7',
    questions: qList,
    rows: rows,
    totalCount: totalCount,
    findCol: findCol
  });

  // [섹션 4] Q22: 할인 쿠폰 제공 시 신제품 구매 의향
  currentRow = renderSection(dashSheet, currentRow, {
    title: '🎁 4. 전용 쿠폰 제공 시 신제품 구매 의향 (Q22: 크로스셀링 잠재력)',
    qId: 'Q22',
    color: '#10B981',
    questions: qList,
    rows: rows,
    totalCount: totalCount,
    findCol: findCol
  });

  // [섹션 5] Q12: 물티슈 선택 시 어려웠던 점
  currentRow = renderSection(dashSheet, currentRow, {
    title: '🔍 5. 물티슈 선택/탐색 과정의 장애요인 (Q12: 고객의 선택 장벽)',
    qId: 'Q12',
    color: '#F59E0B',
    questions: qList,
    rows: rows,
    totalCount: totalCount,
    findCol: findCol
  });
}

function styleCard(sheet, rangeA1, valColor, bgColor) {
  const range = sheet.getRange(rangeA1);
  range.setBackground(bgColor);
  range.setBorder(true, true, true, true, false, false, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
  
  // 첫 행 (라벨)
  const topCell = range.getCell(1, 1);
  topCell.setFontSize(10).setFontWeight('bold').setFontColor('#475569').setHorizontalAlignment('center');

  // 중간 행 (숫자)
  const midCell = range.getCell(2, 1);
  midCell.setFontSize(18).setFontWeight('bold').setFontColor(valColor).setHorizontalAlignment('center');

  // 마지막 행 (설명)
  const botCell = range.getCell(3, 1);
  botCell.setFontSize(8).setFontColor('#94A3B8').setHorizontalAlignment('center');
}

function renderSection(sheet, startRow, cfg) {
  const { title, qId, color, questions, rows, totalCount, findCol } = cfg;
  const q = questions.find(item => item.id === qId);
  const options = q && q.options ? q.options : [];

  // 섹션 헤더
  sheet.getRange(startRow, 1, 1, 7).merge();
  sheet.getRange(startRow, 1).setValue(title)
    .setBackground('#087768')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setVerticalAlignment('middle');
  sheet.setRowHeight(startRow, 32);

  // 테이블 헤더
  const tableHeaders = ['순위', '항목 내용', '응답수', '비율', '시각화 그래프 (비율)', '', ''];
  sheet.getRange(startRow + 1, 1, 1, 7).setValues([tableHeaders]);
  sheet.getRange(startRow + 1, 1, 1, 7)
    .setBackground('#F1F5F9')
    .setFontColor('#334155')
    .setFontWeight('bold')
    .setFontSize(9)
    .setHorizontalAlignment('center');
  sheet.setRowHeight(startRow + 1, 24);

  // 옵션별 데이터 집계 (콤마 구분 다중선택 및 단일선택 완벽 호환)
  const stats = options.map(opt => {
    let count = 0;
    if (totalCount > 0) {
      const col = findCol(q.id);
      if (col >= 0) {
        if (q.type === 'multi') {
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

  // 응답수 내림차순 정렬
  stats.sort((a, b) => b.count - a.count);

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
      sheet.setRowHeight(rowNum, 22);
      if (i % 2 === 1) {
        sheet.getRange(rowNum, 1, 1, 7).setBackground('#F8FAFC');
      }
    }
  }

  // 섹션 간 공백 행
  const nextRow = startRow + 2 + dataRows.length;
  sheet.setRowHeight(nextRow, 16);
  return nextRow + 1;
}

/**
 * 📌 [설문 응답 실시간 수신 웹훅 함수]
 * Netlify 라이브 설문에서 응답 제출 시:
 * 1. [📋 전체 원본]에 직관적인 한글 답변 행 추가 (복수선택도 한 셀에 콤마 구분으로 깔끔 적재)
 * 2. 인터뷰 동의 고객인 경우 [🎙️ 심층 인터뷰 대상자] CRM 시트에 자동 추가
 * 3. 주관식 의견이 있는 경우 [💬 고객 VOC] 시트에 자동 추가
 * 4. [📊 베베숲 인사이트 대시보드] 통계 및 차트 실시간 자동 갱신
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

    const questions = Array.isArray(data.questions) && data.questions.length > 0 ? data.questions : getSurveyQuestions();
    const customerType = data.answers.Q13 || (Array.isArray(data.answers.Q1) ? data.answers.Q1.join(', ') : data.answers.Q1) || '';
    const submittedAt = data.submittedAt || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    // 1. [📋 전체_응답_데이터] 사람이 읽기 쉬운 단일 행 조립
    const nextRowNo = Math.max(1, rawSheet.getLastRow()); // 1행이 헤더이므로 다음은 1, 2, ...
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
        answerText = v.join(', '); // 복수선택은 "항목1, 항목2"로 읽기 쉽게 통합!
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

    // 4. [📊 대시보드] 통계 및 차트 실시간 자동 갱신
    refreshDashboard(book, questions);

    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ ok: false, error: err.message || String(err) });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
