import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  questions,
  visible,
  cleanAnswers,
  validate,
  isValidPhoneNumber,
  formatPhoneNumber,
} from './lib/survey.ts';
import { appsScript } from './lib/apps-script.ts';

const question = (id) => {
  const item = questions.find((candidate) => candidate.id === id);
  assert.ok(item, 'missing question ' + id);
  return item;
};

const statuses = question('Q13').options;
for (let index = 0; index < statuses.length; index += 1) {
  const answers = { Q13: statuses[index] };
  assert.equal(visible(question('Q20-A'), answers), index < 3);
  assert.equal(visible(question('Q20-B'), answers), index === 3);
  assert.equal(visible(question('Q20-C'), answers), index === 4);
  assert.equal(visible(question('Q20-D'), answers), index === 5);
  assert.equal(visible(question('Q24'), answers), index < 4);
}

assert.equal(visible(question('Q6'), { Q4: '베베숲', Q5: '베베숲' }), false);
assert.equal(
  visible(question('Q6'), {
    Q4: '기타 브랜드',
    Q4_other: 'A',
    Q5: '기타 브랜드',
    Q5_other: 'B',
  }),
  true,
);
assert.equal(visible(question('Q8'), { Q7: '네' }), true);
assert.equal(visible(question('Q12'), { Q11: '어려운 편' }), true);
assert.equal(
  visible(question('Q16'), { Q13: statuses[0], Q15: '보통' }),
  false,
);

const noPrizeConsent = {
  Q28: '네, 참여할게요',
  Q30: '동의하지 않습니다',
};
assert.equal(validate([question('Q29'), question('Q30')], noPrizeConsent), '');
assert.equal(
  cleanAnswers(questions, { ...noPrizeConsent, Q29: '01012345678' }).Q29,
  undefined,
);

const noInterviewConsent = {
  Q31: '네, 참여하고 싶어요',
  Q32: [question('Q32').options[0]],
  Q33: [question('Q33').options[0]],
  Q36: '동의하지 않습니다',
};
assert.equal(
  validate(
    [question('Q34'), question('Q35'), question('Q36')],
    noInterviewConsent,
  ),
  '',
);
const cleanedInterview = cleanAnswers(questions, {
  ...noInterviewConsent,
  Q34: '이름',
  Q35: '01012345678',
});
assert.equal(cleanedInterview.Q34, undefined);
assert.equal(cleanedInterview.Q35, undefined);

assert.notEqual(
  validate([question('Q2')], { Q2: question('Q2').options.slice(0, 3) }),
  '',
);
assert.equal(isValidPhoneNumber('01012345678'), true);
assert.equal(formatPhoneNumber('01012345678'), '010-1234-5678');

class Range {
  constructor(sheet, row, column, rows = 1, columns = 1) {
    Object.assign(this, { sheet, row, column, rows, columns });
  }
  getValues() {
    return Array.from({ length: this.rows }, (_, rowIndex) =>
      Array.from(
        { length: this.columns },
        (_, columnIndex) =>
          this.sheet.rows[this.row - 1 + rowIndex]?.[
            this.column - 1 + columnIndex
          ] ?? '',
      ),
    );
  }
  setValues(values) {
    values.forEach((row, rowIndex) => {
      this.sheet.rows[this.row - 1 + rowIndex] ??= [];
      row.forEach((value, columnIndex) => {
        this.sheet.rows[this.row - 1 + rowIndex][
          this.column - 1 + columnIndex
        ] = value;
      });
    });
    return this;
  }
  clearContent() {
    return this.setValues(
      Array.from({ length: this.rows }, () => Array(this.columns).fill('')),
    );
  }
  setNumberFormat() {
    return this;
  }
  setWrap() {
    return this;
  }
}
class Sheet {
  constructor(rows = []) {
    this.rows = rows;
  }
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return Math.max(0, ...this.rows.map((row) => row.length));
  }
  getRange(...args) {
    return new Range(this, ...args);
  }
  getDataRange() {
    return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn());
  }
  clearContents() {
    this.rows = [];
  }
  setFrozenRows() {}
  autoResizeColumns() {}
}
const source = new Sheet([
  [
    '응답ID',
    '제출일시',
    '설문버전',
    '고객유형',
    'Q24',
    'Q28',
    'Q31',
    'Q29',
    'Q34',
    'Q35',
  ],
  [
    'one',
    '2026-09-10',
    'v',
    statuses[0],
    10,
    '네, 참여할게요',
    '네, 참여하고 싶어요',
    "'010-1111-2222",
    '가명',
    "'010-1111-2222",
  ],
  [
    'two',
    '2026-09-10',
    'v',
    statuses[3],
    5,
    '아니요, 참여하지 않을게요',
    '참여가 어려워요',
    '',
    '',
    '',
  ],
]);
const sheets = new Map([['베베숲_응답', source]]);
const book = {
  getId: () => '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s',
  getSheetByName: (name) => sheets.get(name),
  insertSheet: (name) => {
    const sheet = new Sheet();
    sheets.set(name, sheet);
    return sheet;
  },
};
const context = {
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
  },
  SpreadsheetApp: { openById: () => book },
};
vm.createContext(context);
vm.runInContext(appsScript('test-secret'), context);
context.refreshAnalysis(book, questions);
const summary = sheets.get('베베숲_분석_종합');
assert.equal(summary.rows[1][1], 2);
assert.equal(summary.rows[2][1], 0);
const detail = sheets.get('베베숲_응답_상세');
assert.ok(detail.rows[0].some((header) => String(header).startsWith('Q24 ')));
assert.equal(
  detail.rows[0].some((header) => String(header).startsWith('Q29 ')),
  false,
);

let scheduled;
context.ScriptApp = {
  newTrigger: (name) => {
    assert.equal(name, 'deleteInterviewContacts');
    return {
      timeBased: () => ({
        at: (date) => ({
          create: () => {
            scheduled = date;
          },
        }),
      }),
    };
  },
};
context.scheduleContactDeletion();
const days = Math.round((scheduled.getTime() - Date.now()) / 86400000);
assert.equal(days, 90);
context.deleteInterviewContacts();
assert.equal(source.rows[1][7], '');
assert.equal(source.rows[1][8], '');
assert.equal(source.rows[1][9], '');

console.log(
  'PASS: 새 설문 분기, 동의 철회, 전화번호 정리, 분석 시트, 개인정보 제외 상세 시트, 90일 삭제 예약',
);
