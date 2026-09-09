export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export type VisibilityOperator =
  | 'equals'
  | 'not_equals'
  | 'one_of'
  | 'not_one_of'
  | 'answered'
  | 'different_answer';
export type VisibilityRule = {
  questionId: string;
  operator: VisibilityOperator;
  values?: string[];
  compareQuestionId?: string;
};
export type Question = {
  id: string;
  title: string;
  section: number;
  type: 'single' | 'multi' | 'text' | 'phone' | 'score';
  required: boolean;
  options: string[];
  max?: number;
  hint?: string;
  showWhen?: VisibilityRule[];
};
const q = (
  id: string,
  title: string,
  section: number,
  type: Question['type'],
  required: boolean,
  options = '',
  max?: number,
  hint?: string,
): Question => ({
  id,
  title,
  section,
  type,
  required,
  options: options ? options.split('|') : [],
  max,
  hint,
});
export const sections = [
  '물티슈 사용 환경',
  '현재·이전 브랜드 경험',
  '처음 물티슈를 구매한 경험',
  '베베숲 이용 상태',
  '베베숲 제품 선택 경험',
  '베베숲 사용 경험',
  '추천 및 고객상담 경험',
  '인터뷰 참여 신청',
  '개인정보',
];
export const questions: Question[] = [
  q(
    'Q1',
    '물티슈를 주로 누구를 위해 사용하시나요?',
    0,
    'multi',
    true,
    '임신·출산 준비 중|0~12개월 아이|13~36개월 아이|4세 이상 자녀|성인|반려동물|기타',
  ),
  q(
    'Q2',
    '물티슈를 주로 어디에 사용하시나요?',
    0,
    'multi',
    true,
    '아이의 기저귀를 갈 때|아이의 얼굴·입·손을 닦을 때|외출하거나 어린이집에서|집안이나 차량을 청소할 때|성인의 일상생활|반려동물 관리|기타',
    2,
  ),
  q(
    'Q3',
    '평소 물티슈 한 팩을 어느 정도 기간 동안 사용하시나요?',
    0,
    'single',
    true,
    '하루에 2팩 이상|하루에 약 1팩|2일에 약 1팩|3~4일에 약 1팩|5~7일에 약 1팩|8일 이상 사용|정확히 알기 어려움',
  ),
  q(
    'Q4',
    '현재 가장 자주 사용하는 물티슈 브랜드는 무엇인가요?',
    1,
    'single',
    true,
    '베베숲|기타 브랜드|브랜드를 정확히 기억하지 못함',
  ),
  q(
    'Q5',
    '현재 브랜드 이전에는 어떤 브랜드를 가장 많이 사용하셨나요?',
    1,
    'single',
    true,
    '베베숲|기타 브랜드|이전에도 지금과 같은 브랜드를 사용함|이전에 주로 사용한 브랜드가 없음|정확히 기억나지 않음',
  ),
  q(
    'Q6',
    '현재 브랜드로 바꾸게 된 가장 큰 이유는 무엇인가요?',
    1,
    'multi',
    false,
    '원단·두께·수분감이 더 마음에 들어서|아이에게 더 잘 맞고 안심돼서|가격이나 혜택이 더 좋아서|제품을 고르고 구매하기 편해서|기존 제품을 사용하며 불편을 겪어서|추천이나 후기를 보고|기타',
    2,
  ),
  q(
    'Q7',
    '현재 두 가지 이상의 물티슈 브랜드를 함께 사용하고 있나요?',
    1,
    'single',
    true,
    '사용하고 있다|한 브랜드만 사용하고 있다',
  ),
  q(
    'Q8',
    '여러 브랜드를 함께 사용하는 이유는 무엇인가요?',
    1,
    'multi',
    false,
    '사용하는 사람이나 부위에 따라 나눠서|집·외출·어린이집·청소 등 상황에 따라|가격이나 할인에 따라|더 마음에 드는 제품을 찾고 있어서|선물이나 남은 제품이 있어서|브랜드별 차이를 크게 느끼지 않아서|기타',
    2,
  ),
  q(
    'Q9',
    '처음 물티슈를 구매할 때 가장 고민했던 것은 무엇인가요?',
    2,
    'multi',
    true,
    '어떤 브랜드와 제품이 좋은지|아이에게 안심하고 사용할 수 있는지|어떤 두께와 사용감이 적당한지|어떤 성분을 확인해야 하는지|가격과 품질 중 무엇을 우선할지|제품 종류가 많아 무엇을 골라야 할지|오래전이라 기억나지 않음|기타',
    2,
  ),
  q(
    'Q10',
    '처음 물티슈를 구매할 때 필요한 정보를 찾는 것은 어떠셨나요?',
    2,
    'single',
    true,
    '쉽게 찾을 수 있었다|조금 찾아봤지만 어렵지 않았다|찾기 어려운 편이었다|매우 어려웠다|오래전이라 기억나지 않는다',
  ),
  q(
    'Q11',
    '필요한 정보를 찾기 어려웠던 이유는 무엇인가요?',
    2,
    'multi',
    false,
    '무엇을 확인해야 하는지 몰라서|브랜드와 제품 종류가 너무 많아서|성분이나 평량 같은 설명이 어려워서|아이 연령이나 사용 부위별 추천이 부족해서|제품 간 차이를 비교하기 어려워서|후기마다 내용이 달라서|기타',
    2,
  ),
  q(
    'Q12',
    '베베숲 물티슈를 사용해본 경험이 있나요?',
    3,
    'single',
    true,
    '현재 주로 사용하고 있다|현재 다른 브랜드와 함께 사용하고 있다|최근 처음 구매해 사용하고 있다|과거에는 사용했지만 지금은 사용하지 않는다|알고 있지만 구매해본 적은 없다|베베숲을 잘 모른다',
  ),
  q(
    'Q13',
    '현재 사용 중이거나 가장 최근에 사용한 베베숲 제품은 무엇인가요?',
    4,
    'text',
    false,
    '',
    undefined,
    '정확한 제품명을 모르셔도 괜찮습니다. 기억나는 제품명이나 패키지 색상, 특징을 적어주세요. 예: 시그니처 블루, 캘리그라피, 갈색 패키지',
  ),
  q(
    'Q14',
    '베베숲 제품 중 나에게 맞는 제품을 고르는 과정은 어떠셨나요?',
    4,
    'single',
    true,
    '처음부터 쉽게 고를 수 있었다|처음에는 어려웠지만 지금은 쉽게 고른다|지금도 가끔 어떤 제품을 골라야 할지 어렵다|지금도 제품 간 차이를 알기 어렵다|항상 같은 제품만 구매해 다른 제품은 잘 모른다|오래전이라 기억나지 않는다',
  ),
  q(
    'Q15',
    '베베숲 제품을 고르기 어려웠던 이유는 무엇인가요?',
    4,
    'multi',
    false,
    '제품 종류와 이름이 많아서|패키지 색상이나 디자인이 비슷해서|성분·원단·두께 차이를 이해하기 어려워서|누구에게, 어디에 사용하는 제품인지 알기 어려워서|가격 차이가 나는 이유를 알기 어려워서|기존 제품·신제품·단종 제품의 관계를 알기 어려워서|기타',
    2,
  ),
  q(
    'Q16',
    '실제로 비교하거나 헷갈렸던 제품이 있다면 알려주세요',
    4,
    'text',
    false,
    '',
    undefined,
    '정확한 제품명을 모르셔도 괜찮습니다. 예: 시그니처 블루와 위드 블루, 블루와 블루 에코, 파란색 제품들이 비슷해 보여 헷갈렸음',
  ),
  q(
    'Q17',
    '베베숲 제품을 더 쉽게 고르기 위해 어떤 정보가 가장 필요하다고 생각하시나요?',
    4,
    'multi',
    false,
    '제품별 차이를 한눈에 보는 비교표|아이 연령이나 사용 부위별 추천|두께와 사용감을 쉽게 보여주는 설명|몇 가지 질문에 답하면 제품을 찾아주는 추천 기능|실제 고객의 사용 후기|단종 제품을 대신할 제품 안내|현재 정보로도 충분하다|기타',
    2,
  ),
  q(
    'Q18-A',
    '베베숲을 선택한 가장 큰 이유는 무엇인가요?',
    5,
    'multi',
    false,
    '아이에게 사용하기 안심돼서|브랜드를 믿을 수 있어서|원단·두께·수분감이 마음에 들어서|가격이나 혜택이 좋아서|추천이나 후기를 보고|익숙하고 구매하기 편해서|기타',
    2,
  ),
  q(
    'Q19-A',
    '베베숲을 사용하면서 가장 만족했던 점은 무엇인가요?',
    5,
    'multi',
    false,
    '아이에게 잘 맞고 안심된다|원단과 사용감이 좋다|두께와 수분감이 적당하다|한 장씩 잘 뽑혀 사용하기 편하다|가격 대비 품질이 좋다|구매와 배송이 편리하다|기타',
    2,
  ),
  q(
    'Q20-A',
    '베베숲을 사용하면서 불편하거나 아쉬웠던 점은 무엇인가요?',
    5,
    'multi',
    false,
    '원단·두께·수분감이 기대와 달랐다|여러 장이 뽑히거나 사용이 불편했다|향·성분·아이 사용에 아쉬움이 있었다|가격이 부담됐다|제품을 고르기 어려웠다|포장이나 배송에 문제가 있었다|특별히 아쉬운 점은 없다|기타',
    2,
  ),
  q(
    'Q21-A',
    '기억에 남는 만족 또는 불편 경험이 있다면 알려주세요',
    5,
    'text',
    false,
  ),
  q(
    'Q18-B',
    '베베숲 사용을 중단한 가장 큰 이유는 무엇인가요?',
    5,
    'multi',
    false,
    '원단·두께·수분감이 맞지 않아서|아이에게 잘 맞지 않거나 성분이 걱정돼서|가격이나 혜택이 아쉬워서|제품을 고르거나 구매하기 어려워서|포장·배송·제품 사용 중 불편이 있어서|다른 브랜드 제품이 더 마음에 들어서|아이가 성장해 사용 목적이 달라져서|기타',
    2,
  ),
  q(
    'Q19-B',
    '현재 제품이 베베숲보다 더 낫다고 느끼는 점은 무엇인가요?',
    5,
    'multi',
    false,
    '아이에게 더 잘 맞고 안심된다|원단과 사용감이 더 좋다|두께와 수분감이 더 적당하다|가격이나 혜택이 더 좋다|제품을 고르고 구매하기 쉽다|사용·포장·배송이 더 편리하다|특별히 더 낫다고 느끼는 점은 없다|기타',
    2,
  ),
  q(
    'Q20-B',
    '어떤 점이 달라진다면 베베숲을 다시 구매할 것 같나요?',
    5,
    'text',
    false,
  ),
  q(
    'Q18-C',
    '베베숲을 알고도 아직 구매하지 않은 이유는 무엇인가요?',
    5,
    'multi',
    false,
    '현재 사용하는 제품에 만족해서|가격이 부담스러워서|제품이 많아 무엇을 사야 할지 몰라서|다른 브랜드가 더 익숙해서|성분이나 품질에 확신이 없어서|베베숲을 충분히 알아볼 기회가 없어서|특별한 이유는 없음|기타',
    2,
  ),
  q(
    'Q19-C',
    '어떤 정보가 있다면 베베숲 구매를 고려하는 데 도움이 될까요?',
    5,
    'multi',
    false,
    '나에게 맞는 추천 제품|제품별 차이|아이 연령과 사용 부위별 안내|성분·원단·두께에 대한 쉬운 설명|실제 고객의 사용 후기|가격과 구매 혜택|기타',
    2,
  ),
  q(
    'Q22',
    '베베숲을 가족이나 지인에게 추천할 가능성은 얼마나 되나요?',
    6,
    'score',
    true,
    '0|1|2|3|4|5|6|7|8|9|10',
    undefined,
    '0점: 전혀 추천하지 않음 · 10점: 반드시 추천함',
  ),
  q('Q23', '그렇게 평가하신 가장 큰 이유는 무엇인가요?', 6, 'text', true),
  q(
    'Q24',
    '베베숲 고객센터에 문의해본 경험이 있나요?',
    6,
    'single',
    true,
    '제품을 고르거나 제품 정보를 확인하기 위해 문의했다|주문·배송·교환과 관련해 문의했다|제품 사용이나 품질 문제로 문의했다|다른 내용으로 문의했다|문의한 적 없다',
  ),
  q(
    'Q25',
    '상담 과정에서 좋았던 점이나 불편했던 점이 있다면 알려주세요',
    6,
    'text',
    false,
  ),
  q(
    'Q26',
    '인터뷰에 참여하실 의향이 있나요?',
    7,
    'single',
    true,
    '참여하고 싶다|일정과 진행 방법을 확인한 후 결정하고 싶다|참여가 어렵다',
  ),
  q(
    'Q27',
    '인터뷰에서 이야기하고 싶은 경험은 무엇인가요?',
    7,
    'multi',
    false,
    '처음 물티슈를 선택했던 경험|베베숲 제품을 고르기 어려웠던 경험|여러 브랜드를 비교하거나 바꾼 경험|베베숲을 계속 구매하거나 중단한 이유|제품 사용 또는 고객상담 중 불편했던 경험|기타',
  ),
  q(
    'Q28',
    '인터뷰 가능한 시간대를 선택해주세요',
    7,
    'multi',
    false,
    '평일 오전|평일 오후|평일 저녁|주말|일정 조율 필요',
  ),
  q(
    'Q31',
    '개인정보 수집·이용에 동의하시나요?',
    8,
    'single',
    true,
    '동의합니다|동의하지 않습니다',
  ),
  q('Q29', '성함 또는 닉네임을 적어주세요', 8, 'text', true),
  q('Q30', '연락 가능한 휴대전화 번호를 적어주세요', 8, 'phone', true),
];
const defaultShowWhen: Record<string, VisibilityRule[]> = {
  Q6: [
    { questionId: 'Q5', operator: 'answered' },
    {
      questionId: 'Q5',
      operator: 'not_one_of',
      values: [
        '이전에도 지금과 같은 브랜드를 사용함',
        '이전에 주로 사용한 브랜드가 없음',
        '정확히 기억나지 않음',
      ],
    },
    {
      questionId: 'Q5',
      operator: 'different_answer',
      compareQuestionId: 'Q4',
    },
  ],
  Q8: [{ questionId: 'Q7', operator: 'equals', values: ['사용하고 있다'] }],
  Q11: [
    {
      questionId: 'Q10',
      operator: 'one_of',
      values: ['찾기 어려운 편이었다', '매우 어려웠다'],
    },
  ],
  Q13: [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 4) }],
  Q14: [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 4) }],
  Q15: [{ questionId: 'Q14', operator: 'one_of', values: questions.find((x) => x.id === 'Q14')!.options.slice(1, 4) }],
  Q16: [{ questionId: 'Q14', operator: 'one_of', values: questions.find((x) => x.id === 'Q14')!.options.slice(1, 4) }],
  Q17: [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 4) }],
  'Q18-A': [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 3) }],
  'Q19-A': [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 3) }],
  'Q20-A': [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 3) }],
  'Q21-A': [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 3) }],
  'Q18-B': [{ questionId: 'Q12', operator: 'equals', values: [questions.find((x) => x.id === 'Q12')!.options[3]] }],
  'Q19-B': [{ questionId: 'Q12', operator: 'equals', values: [questions.find((x) => x.id === 'Q12')!.options[3]] }],
  'Q20-B': [{ questionId: 'Q12', operator: 'equals', values: [questions.find((x) => x.id === 'Q12')!.options[3]] }],
  'Q18-C': [{ questionId: 'Q12', operator: 'equals', values: [questions.find((x) => x.id === 'Q12')!.options[4]] }],
  'Q19-C': [{ questionId: 'Q12', operator: 'equals', values: [questions.find((x) => x.id === 'Q12')!.options[4]] }],
  Q22: [{ questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 4) }],
  Q23: [
    { questionId: 'Q12', operator: 'one_of', values: questions.find((x) => x.id === 'Q12')!.options.slice(0, 4) },
    { questionId: 'Q22', operator: 'answered' },
  ],
  Q24: [{ questionId: 'Q12', operator: 'not_equals', values: [questions.find((x) => x.id === 'Q12')!.options[5]] }],
  Q25: [{ questionId: 'Q24', operator: 'one_of', values: questions.find((x) => x.id === 'Q24')!.options.slice(0, 4) }],
  Q27: [{ questionId: 'Q26', operator: 'one_of', values: questions.find((x) => x.id === 'Q26')!.options.slice(0, 2) }],
  Q28: [{ questionId: 'Q26', operator: 'one_of', values: questions.find((x) => x.id === 'Q26')!.options.slice(0, 2) }],
  Q31: [{ questionId: 'Q26', operator: 'one_of', values: questions.find((x) => x.id === 'Q26')!.options.slice(0, 2) }],
  Q29: [
    { questionId: 'Q26', operator: 'one_of', values: questions.find((x) => x.id === 'Q26')!.options.slice(0, 2) },
    { questionId: 'Q31', operator: 'equals', values: ['동의합니다'] },
  ],
  Q30: [
    { questionId: 'Q26', operator: 'one_of', values: questions.find((x) => x.id === 'Q26')!.options.slice(0, 2) },
    { questionId: 'Q31', operator: 'equals', values: ['동의합니다'] },
  ],
};
export function hydrateQuestions(items: Question[]) {
  return items.map((item) => ({
    ...item,
    showWhen: item.showWhen ?? defaultShowWhen[item.id],
  }));
}
for (const item of questions) item.showWhen = defaultShowWhen[item.id];
export const privacy =
  '수집 항목: 성함 또는 닉네임, 휴대전화 번호\n수집 목적: 인터뷰 참여 의사 확인 및 대상자 선정, 인터뷰 일정 안내와 진행 관련 연락, 설문 또는 인터뷰 참여 혜택 제공\n보유 및 이용 기간: 인터뷰와 참여 혜택 제공이 종료된 날로부터 90일 이내 파기합니다.\n동의하지 않을 수 있으며, 이 경우 인터뷰 대상자 선정과 참여 혜택 제공이 어려울 수 있습니다. 동의하지 않아도 설문은 제출할 수 있습니다.';
export function visible(q: Question, a: Answers) {
  if (!q.showWhen?.length) return true;
  const answer = (id: string) => {
    const value = a[id];
    if (value === '기타 브랜드') return String(a[id + '_other'] ?? '').trim();
    return value;
  };
  return q.showWhen.every((rule) => {
    const value = answer(rule.questionId);
    const list = Array.isArray(value) ? value : [String(value ?? '')];
    const values = rule.values ?? [];
    if (rule.operator === 'answered')
      return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim() !== '';
    if (rule.operator === 'equals') return list.includes(values[0] ?? '');
    if (rule.operator === 'not_equals') return !list.includes(values[0] ?? '');
    if (rule.operator === 'one_of') return list.some((x) => values.includes(x));
    if (rule.operator === 'not_one_of') return list.every((x) => !values.includes(x));
    if (rule.operator === 'different_answer')
      return String(value ?? '').trim() !== String(answer(rule.compareQuestionId || '') ?? '').trim();
    return true;
  });
}
export function cleanAnswers(qs: Question[], a: Answers) {
  const clean: Answers = {};
  for (const q of qs) {
    if (!visible(q, clean)) continue;
    const v = a[q.id];
    if (v !== undefined) clean[q.id] = v;
    const other = Array.isArray(v)
      ? v.some((x) => x === '기타' || x === '기타 브랜드')
      : v === '기타' || v === '기타 브랜드';
    if (other && typeof a[q.id + '_other'] === 'string')
      clean[q.id + '_other'] = a[q.id + '_other'];
  }
  return clean;
}
export function validate(qs: Question[], a: Answers) {
  for (const q of qs) {
    if (!visible(q, a)) continue;
    const v = a[q.id];
    if (
      q.required &&
      (!v ||
        (typeof v === 'string' && !v.trim()) ||
        (Array.isArray(v) && !v.length))
    )
      return `${q.id}에 응답해주세요.`;
    if (v === undefined || v === '') continue;
    if (q.type === 'multi') {
      if (
        !Array.isArray(v) ||
        v.some((x) => !q.options.includes(x)) ||
        new Set(v).size !== v.length ||
        (q.max && v.length > q.max)
      )
        return `${q.id}의 선택 항목을 확인해주세요.`;
    } else if (typeof v !== 'string' || v.length > 3000)
      return `${q.id}의 답변을 확인해주세요.`;
    else if (['single', 'score'].includes(q.type) && !q.options.includes(v))
      return `${q.id}의 선택 항목을 확인해주세요.`;
    if (q.type === 'phone' && typeof v === 'string' && !isValidPhoneNumber(v))
      return '휴대전화 번호를 확인해주세요.';
    if (v === '기타 브랜드' && !String(a[q.id + '_other'] ?? '').trim())
      return `${q.id}의 브랜드명을 적어주세요.`;
    if (
      typeof a[q.id + '_other'] === 'string' &&
      String(a[q.id + '_other']).length > 1000
    )
      return `${q.id}의 기타 답변은 1,000자 이내로 적어주세요.`;
  }
  return '';
}

export function isValidPhoneNumber(value: string) {
  return /^(?:010\d{8}|01[16789]\d{7,8})$/.test(value.replace(/[-\s]/g, ''));
}
export function formatPhoneNumber(value: string) {
  if (!isValidPhoneNumber(value)) return value;
  const digits = value.replace(/[-\s]/g, '');
  return (
    digits.slice(0, 3) + '-' + digits.slice(3, -4) + '-' + digits.slice(-4)
  );
}
