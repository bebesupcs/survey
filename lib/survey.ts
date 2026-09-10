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
export const CURRENT_SURVEY_VERSION = '2026-09-10';
export const sections = [
  '평소 물티슈 사용',
  '현재 사용하는 물티슈',
  '처음 구매한 경험',
  '베베숲 사용 여부',
  '베베숲 제품 선택',
  '고객 유형별 경험',
  '베베숲 이용 경험',
  '경품 응모',
  '인터뷰 신청',
];
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
const difficulties =
  '어떤 제품이 나에게 맞는지 몰라서|제품 종류가 너무 많아서|제품마다 뭐가 다른지 몰라서|제품 이름이 비슷해서 헷갈려서|성분이나 원단 설명이 어려워서|두께나 사용감을 예상하기 어려워서|가격이 왜 다른지 알기 어려워서|원하는 정보를 찾기 어려워서|기타';
export const questions: Question[] = [
  q(
    'Q1',
    '물티슈를 주로 누구를 위해 사용하시나요?',
    0,
    'multi',
    true,
    '임신·출산 준비|0~12개월 아이|13~36개월 아이|4세 이상 자녀|성인|반려동물|기타',
  ),
  q(
    'Q2',
    '물티슈를 주로 어디에 사용하시나요?',
    0,
    'multi',
    true,
    '기저귀 교체|아이 얼굴·입·손 닦기|외출·어린이집|집안·차량 청소|성인 일상생활|반려동물 케어|기타',
    2,
  ),
  q(
    'Q3',
    '물티슈 한 팩을 보통 며칠 동안 사용하시나요?',
    0,
    'single',
    true,
    '하루에 2팩 이상|하루에 1팩|약 2일|약 3~4일|일주일 이상',
  ),
  q(
    'Q4',
    '현재 가장 자주 사용하는 물티슈 브랜드는 무엇인가요?',
    1,
    'single',
    true,
    '베베숲|기타 브랜드',
  ),
  q(
    'Q5',
    '그전에는 어떤 브랜드를 가장 자주 사용하셨나요?',
    1,
    'single',
    true,
    '베베숲|기타 브랜드|지금과 같은 브랜드|이전에 사용한 브랜드 없음|기억나지 않음',
  ),
  q(
    'Q6',
    '지금 사용하는 브랜드로 바꾼 가장 큰 이유는 무엇인가요?',
    1,
    'single',
    false,
    '피부 자극이 적어서|성분이 마음에 들어서|원단이 부드러워서|원단이 도톰해서|수분감이 좋아서|한 장씩 잘 뽑혀서|가격이 합리적이어서|할인이나 혜택이 좋아서|원하는 제품을 고르기 쉬워서|쉽게 구매할 수 있어서|추천이나 후기가 좋아서|기타',
  ),
  q(
    'Q7',
    '현재 여러 물티슈 브랜드를 함께 사용하시나요?',
    1,
    'single',
    true,
    '네|아니요',
  ),
  q(
    'Q8',
    '여러 브랜드를 함께 사용하는 이유는 무엇인가요?',
    1,
    'multi',
    false,
    '사용하는 사람이나 부위가 달라서|사용하는 상황이 달라서|가격이나 할인에 따라|더 잘 맞는 제품을 찾고 있어서|선물 받거나 남은 제품이 있어서|브랜드별 차이를 크게 못 느껴서|기타',
    2,
  ),
  q(
    'Q9',
    '처음 물티슈를 살 때 중요하게 본 것은 무엇인가요?',
    2,
    'multi',
    true,
    '피부 자극이 적은지|성분이 안심되는지|원단이 부드러운지|원단이 너무 얇지 않은지|수분감이 충분한지|한 장씩 잘 뽑히는지|가격이 부담스럽지 않은지|할인이나 혜택이 좋은지|믿을 수 있는 브랜드인지|다른 사람들의 추천이나 후기|특별히 없음|기타',
    2,
  ),
  q(
    'Q10',
    '처음 물티슈를 살 때 제품 정보를 따로 알아보셨나요?',
    2,
    'single',
    true,
    '여러 제품을 찾아보고 비교했다|필요한 정보만 찾아봤다|추천이나 후기를 찾아봤다|따로 알아보지 않았다|기억나지 않는다',
  ),
  q(
    'Q11',
    '제품 정보를 찾고 비교하는 것은 어떠셨나요?',
    2,
    'single',
    true,
    '매우 쉬움|쉬운 편|보통|어려운 편|매우 어려움|기억나지 않음',
  ),
  q('Q12', '어떤 점이 어려우셨나요?', 2, 'multi', true, difficulties, 2),
  q(
    'Q13',
    '베베숲 물티슈를 사용해본 적이 있나요?',
    3,
    'single',
    true,
    '현재 주로 사용하고 있다|다른 브랜드와 함께 사용하고 있다|최근 처음 사용했다|예전에 사용했다|알고 있지만 구매한 적은 없다|베베숲을 잘 모른다',
  ),
  q(
    'Q14',
    '현재 또는 가장 최근에 사용한 베베숲 제품을 알려주세요.',
    4,
    'text',
    false,
    '',
    undefined,
    '정확한 제품명을 몰라도 괜찮습니다. 제품명, 패키지 색상 또는 기억나는 특징을 적어주세요.',
  ),
  q(
    'Q15',
    '베베숲 제품을 고르는 것은 어떠셨나요?',
    4,
    'single',
    true,
    '매우 쉬움|쉬운 편|보통|어려운 편|매우 어려움|기억나지 않음',
  ),
  q('Q16', '어떤 점이 어려우셨나요?', 4, 'multi', true, difficulties, 2),
  q(
    'Q17',
    '실제로 비교하거나 헷갈렸던 베베숲 제품이 있다면 알려주세요.',
    4,
    'text',
    false,
    '',
    undefined,
    '정확한 제품명을 몰라도 괜찮습니다. 패키지 색상이나 기억나는 특징만 적어주셔도 됩니다.',
  ),
  q(
    'Q18',
    '베베숲 제품을 고를 때 어떤 정보가 가장 궁금한가요?',
    4,
    'multi',
    true,
    '아이에게 사용하기 적합한지|성인이나 가족이 사용하기 적합한지|청소 등 용도에 적합한지|제품마다 어떤 차이가 있는지|원단의 두께와 촉감이 어떤지|성분이 어떻게 다른지|가격이 왜 다른지|실제 사용 후기가 어떤지|기타',
    2,
  ),
  q(
    'Q19',
    '어떤 안내가 있으면 제품을 고르기 쉬울 것 같나요?',
    4,
    'multi',
    true,
    '제품을 한눈에 비교하는 표|아이 연령에 맞는 제품 추천|사용하는 용도에 맞는 제품 추천|몇 가지 질문으로 나에게 맞는 제품 추천|제품별 차이를 짧게 정리한 안내|실제 사용 후기|비슷한 제품끼리 비교한 안내|지금도 충분하다|기타',
    2,
  ),
  q(
    'Q20-A',
    '베베숲을 선택한 가장 큰 이유는 무엇인가요?',
    5,
    'single',
    true,
    '피부 자극이 적어서|성분이 마음에 들어서|원단이 부드러워서|원단이 도톰해서|수분감이 좋아서|한 장씩 잘 뽑혀서|원단 크기가 커서|가격이 합리적이어서|할인이나 혜택이 좋아서|믿을 수 있는 브랜드라서|추천이나 후기가 좋아서|쉽게 구매할 수 있어서|기타',
  ),
  q(
    'Q21-A',
    '베베숲을 사용하면서 특히 만족한 점은 무엇인가요?',
    5,
    'multi',
    true,
    '피부 자극이 적다|성분이 마음에 든다|원단이 부드럽다|원단이 도톰하다|수분감이 충분하다|한 장씩 잘 뽑힌다|원단 크기가 적당하다|엠보싱이 마음에 든다|가격이 합리적이다|할인이나 혜택이 좋다|포장이 사용하기 편하다|쉽게 구매할 수 있다|특별히 없음|기타',
    3,
  ),
  q(
    'Q22-A',
    '베베숲을 사용하면서 불편하거나 아쉬운 점은 무엇인가요?',
    5,
    'multi',
    true,
    '피부 자극이 느껴진다|성분이 아쉽다|원단이 거칠다|원단이 너무 얇다|수분감이 부족하다|수분이 너무 많다|여러 장이 한꺼번에 뽑힌다|원단 크기가 작다|엠보싱이 아쉽다|가격이 부담스럽다|포장이 사용하기 불편하다|배송 상태가 아쉽다|원하는 제품을 고르기 어렵다|특별히 없음|기타',
    3,
  ),
  q(
    'Q23-A',
    '위 내용 외에 기억에 남는 점이 있다면 자유롭게 알려주세요.',
    5,
    'text',
    false,
  ),
  q(
    'Q20-B',
    '지금은 베베숲을 사용하지 않는 가장 큰 이유는 무엇인가요?',
    5,
    'single',
    true,
    '피부 자극이 느껴져서|성분이 마음에 들지 않아서|원단이 거칠어서|원단이 너무 얇아서|수분감이 부족하거나 너무 많아서|여러 장이 한꺼번에 뽑혀서|원단 크기가 아쉬워서|가격이 부담스러워서|원하는 제품을 고르기 어려워서|구매하기 불편해서|다른 브랜드 제품이 더 마음에 들어서|물티슈 사용량이 줄어서|기타',
  ),
  q(
    'Q21-B',
    '지금 사용하는 제품을 선택한 이유는 무엇인가요?',
    5,
    'multi',
    true,
    '피부 자극이 적어서|성분이 마음에 들어서|원단이 부드러워서|원단이 도톰해서|수분감이 좋아서|한 장씩 잘 뽑혀서|원단 크기가 마음에 들어서|엠보싱이 마음에 들어서|가격이 합리적이어서|할인이나 혜택이 좋아서|원하는 제품을 고르기 쉬워서|구매하기 편해서|기타',
    2,
  ),
  q(
    'Q22-B',
    '베베숲을 다시 사용한다면 어떤 점이 달라졌으면 좋을까요?',
    5,
    'text',
    false,
  ),
  q(
    'Q20-C',
    '지금까지 베베숲을 구매하지 않은 가장 큰 이유는 무엇인가요?',
    5,
    'single',
    true,
    '지금 사용하는 제품이 만족스러워서|베베숲을 살 필요성을 느끼지 못해서|어떤 제품을 사야 할지 몰라서|제품별 차이를 잘 몰라서|가격이 부담스러워서|다른 브랜드가 더 익숙해서|베베숲 제품을 잘 몰라서|구매할 기회가 없어서|기타',
  ),
  q(
    'Q21-C',
    '베베숲을 구매한다면 어떤 점을 가장 먼저 확인하고 싶으신가요?',
    5,
    'multi',
    true,
    '피부 자극이 적은지|성분이 안심되는지|원단이 부드러운지|원단이 너무 얇지 않은지|수분감이 충분한지|아이 연령에 맞는 제품인지|어떤 용도로 쓰기 좋은지|제품마다 뭐가 다른지|가격이 부담스럽지 않은지|실제 사용 후기가 어떤지|기타',
    2,
  ),
  q(
    'Q20-D',
    '평소 물티슈를 고를 때 중요하게 보는 것은 무엇인가요?',
    5,
    'multi',
    true,
    '피부 자극이 적은지|성분이 안심되는지|원단이 부드러운지|원단이 너무 얇지 않은지|수분감이 충분한지|한 장씩 잘 뽑히는지|원단 크기가 적당한지|가격이 부담스럽지 않은지|할인이나 혜택이 좋은지|믿을 수 있는 브랜드인지|추천이나 후기가 좋은지|쉽게 구매할 수 있는지|기타',
    2,
  ),
  q(
    'Q24',
    '베베숲을 가족이나 지인에게 추천할 가능성은 얼마나 되나요?',
    6,
    'score',
    true,
    '0|1|2|3|4|5|6|7|8|9|10',
    undefined,
    '0점: 전혀 추천하고 싶지 않다 · 10점: 꼭 추천하고 싶다',
  ),
  q('Q25', '그렇게 생각하신 가장 큰 이유는 무엇인가요?', 6, 'text', true),
  q(
    'Q26',
    '베베숲 고객센터에 문의해본 적이 있나요?',
    6,
    'single',
    true,
    '제품을 고르기 어려워서|제품 차이가 궁금해서|사용 방법이나 제품 정보가 궁금해서|주문·배송·교환 때문에|제품 사용이나 품질 문제 때문에|기타 문의|문의한 적 없음',
  ),
  q(
    'Q27',
    '상담하면서 기억에 남는 점이 있다면 알려주세요.',
    6,
    'text',
    false,
    '',
    undefined,
    '좋았던 점이나 불편했던 점 모두 편하게 적어주세요.',
  ),
  q(
    'Q28',
    '경품 추첨에 참여하시겠어요?',
    7,
    'single',
    true,
    '네, 참여할게요|아니요, 참여하지 않을게요',
  ),
  q('Q29', '당첨 안내를 받을 휴대전화 번호를 입력해주세요.', 7, 'phone', true),
  q(
    'Q30',
    '개인정보 수집·이용에 동의하시나요?',
    7,
    'single',
    true,
    '동의합니다|동의하지 않습니다',
  ),
  q(
    'Q31',
    '인터뷰에 참여하실 생각이 있으신가요?',
    8,
    'single',
    true,
    '네, 참여하고 싶어요|자세한 내용을 확인한 후 결정하고 싶어요|참여가 어려워요',
  ),
  q(
    'Q32',
    '어떤 경험에 대해 이야기하고 싶으신가요?',
    8,
    'multi',
    true,
    '처음 물티슈를 골랐던 경험|여러 제품을 비교했던 경험|사용 브랜드를 바꾼 경험|베베숲을 사용했던 경험|제품을 사용하면서 느낀 점|고객센터를 이용했던 경험|기타',
  ),
  q(
    'Q33',
    '가능한 시간대를 선택해주세요.',
    8,
    'multi',
    true,
    '평일 오전(12시 이전)|평일 오후(12~17시)|평일 저녁(17시 이후)|일정 조율 필요',
  ),
  q('Q34', '성함 또는 닉네임을 알려주세요.', 8, 'text', true),
  q(
    'Q35',
    '연락받을 휴대전화 번호를 입력해주세요.',
    8,
    'phone',
    true,
    '',
    undefined,
    '경품 응모 시 휴대전화 번호를 입력했다면 다시 입력하지 않습니다.',
  ),
  q(
    'Q36',
    '인터뷰를 위한 개인정보 이용에 동의하시나요?',
    8,
    'single',
    true,
    '동의합니다|동의하지 않습니다',
  ),
];
export const prizePrivacy =
  '수집 정보: 휴대전화 번호\n이용 목적: 경품 추첨, 당첨자 안내 및 경품 지급\n보유 및 이용 기간: 경품 지급 완료 후 3개월\n개인정보는 위 목적을 위해서만 이용되며, 보유기간이 지나거나 이용 목적이 달성된 경우 지체 없이 파기합니다.';
export const interviewPrivacy =
  '이용 정보: 성함 또는 닉네임, 휴대전화 번호\n이용 목적: 인터뷰 참여자 선정, 인터뷰 일정 안내, 인터뷰 진행, 인터뷰 참여 혜택 제공\n보유 및 이용 기간: 인터뷰 종료 및 참여 혜택 제공 완료 후 3개월\n개인정보는 위 목적을 위해서만 이용되며, 보유기간이 지나거나 이용 목적이 달성된 경우 지체 없이 파기합니다.';
const optionsOf = (id: string) =>
  questions.find((item) => item.id === id)?.options ?? [];
const defaultShowWhen: Record<string, VisibilityRule[]> = {
  Q6: [
    { questionId: 'Q5', operator: 'answered' },
    {
      questionId: 'Q5',
      operator: 'not_one_of',
      values: [
        '지금과 같은 브랜드',
        '이전에 사용한 브랜드 없음',
        '기억나지 않음',
      ],
    },
    { questionId: 'Q5', operator: 'different_answer', compareQuestionId: 'Q4' },
  ],
  Q8: [{ questionId: 'Q7', operator: 'equals', values: ['네'] }],
  Q12: [
    {
      questionId: 'Q11',
      operator: 'one_of',
      values: ['어려운 편', '매우 어려움'],
    },
  ],
  Q14: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q15: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q16: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
    {
      questionId: 'Q15',
      operator: 'one_of',
      values: ['어려운 편', '매우 어려움'],
    },
  ],
  Q17: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q18: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q19: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  'Q20-A': [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 3),
    },
  ],
  'Q21-A': [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 3),
    },
  ],
  'Q22-A': [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 3),
    },
  ],
  'Q23-A': [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 3),
    },
  ],
  'Q20-B': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[3]] },
  ],
  'Q21-B': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[3]] },
  ],
  'Q22-B': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[3]] },
  ],
  'Q20-C': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[4]] },
  ],
  'Q21-C': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[4]] },
  ],
  'Q20-D': [
    { questionId: 'Q13', operator: 'equals', values: [optionsOf('Q13')[5]] },
  ],
  Q24: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q25: [
    {
      questionId: 'Q13',
      operator: 'one_of',
      values: optionsOf('Q13').slice(0, 4),
    },
  ],
  Q26: [
    { questionId: 'Q13', operator: 'answered' },
    {
      questionId: 'Q13',
      operator: 'not_equals',
      values: [optionsOf('Q13')[5]],
    },
  ],
  Q27: [
    {
      questionId: 'Q26',
      operator: 'one_of',
      values: optionsOf('Q26').slice(0, 6),
    },
  ],
  Q29: [{ questionId: 'Q28', operator: 'equals', values: ['네, 참여할게요'] }],
  Q30: [{ questionId: 'Q28', operator: 'equals', values: ['네, 참여할게요'] }],
  Q32: [
    {
      questionId: 'Q31',
      operator: 'one_of',
      values: optionsOf('Q31').slice(0, 2),
    },
  ],
  Q33: [
    {
      questionId: 'Q31',
      operator: 'one_of',
      values: optionsOf('Q31').slice(0, 2),
    },
  ],
  Q34: [
    {
      questionId: 'Q31',
      operator: 'one_of',
      values: optionsOf('Q31').slice(0, 2),
    },
  ],
  Q35: [
    {
      questionId: 'Q31',
      operator: 'one_of',
      values: optionsOf('Q31').slice(0, 2),
    },
  ],
  Q36: [
    {
      questionId: 'Q31',
      operator: 'one_of',
      values: optionsOf('Q31').slice(0, 2),
    },
  ],
};
export function hydrateQuestions(items: Question[]) {
  return items.map((item) => ({
    ...item,
    showWhen: item.showWhen ?? defaultShowWhen[item.id],
  }));
}
for (const item of questions) item.showWhen = defaultShowWhen[item.id];
export function visible(item: Question, a: Answers) {
  const answer = (id: string) => {
    const value = a[id];
    if (value === '기타 브랜드') return String(a[id + '_other'] ?? '').trim();
    return value;
  };
  const matches =
    !item.showWhen?.length ||
    item.showWhen.every((rule) => {
      const value = answer(rule.questionId);
      const list = Array.isArray(value) ? value : [String(value ?? '')];
      const values = rule.values ?? [];
      if (rule.operator === 'answered')
        return Array.isArray(value)
          ? value.length > 0
          : String(value ?? '').trim() !== '';
      if (rule.operator === 'equals') return list.includes(values[0] ?? '');
      if (rule.operator === 'not_equals')
        return !list.includes(values[0] ?? '');
      if (rule.operator === 'one_of')
        return list.some((entry) => values.includes(entry));
      if (rule.operator === 'not_one_of')
        return list.every((entry) => !values.includes(entry));
      if (rule.operator === 'different_answer')
        return (
          String(value ?? '').trim() !==
          String(answer(rule.compareQuestionId || '') ?? '').trim()
        );
      return true;
    });
  if (!matches) return false;
  if (item.id === 'Q35')
    return !(
      a.Q28 === '네, 참여할게요' &&
      a.Q30 === '동의합니다' &&
      isValidPhoneNumber(String(a.Q29 ?? ''))
    );
  return true;
}
export function cleanAnswers(qs: Question[], a: Answers) {
  const clean: Answers = {};
  for (const item of qs) {
    if (!visible(item, clean)) continue;
    const v = a[item.id];
    if (v !== undefined) clean[item.id] = v;
    const other = Array.isArray(v)
      ? v.includes('기타')
      : v === '기타' || v === '기타 브랜드';
    if (other && typeof a[item.id + '_other'] === 'string')
      clean[item.id + '_other'] = a[item.id + '_other'];
  }
  if (clean.Q30 !== '동의합니다') delete clean.Q29;
  if (clean.Q36 !== '동의합니다') {
    delete clean.Q34;
    delete clean.Q35;
  } else if (
    !clean.Q35 &&
    clean.Q30 === '동의합니다' &&
    typeof clean.Q29 === 'string'
  )
    clean.Q35 = clean.Q29;
  return clean;
}
export function validate(qs: Question[], a: Answers) {
  for (const item of qs) {
    if (!visible(item, a)) continue;
    if (
      (item.id === 'Q29' && a.Q30 === '동의하지 않습니다') ||
      (['Q34', 'Q35'].includes(item.id) && a.Q36 === '동의하지 않습니다')
    )
      continue;
    const v = a[item.id];
    if (
      item.required &&
      (!v ||
        (typeof v === 'string' && !v.trim()) ||
        (Array.isArray(v) && !v.length))
    )
      return `${item.id}에 응답해주세요.`;
    if (v === undefined || v === '') continue;
    if (item.type === 'multi') {
      if (
        !Array.isArray(v) ||
        v.some((x) => !item.options.includes(x)) ||
        new Set(v).size !== v.length ||
        (item.max && v.length > item.max)
      )
        return `${item.id}의 선택 항목을 확인해주세요.`;
    } else if (typeof v !== 'string' || v.length > 3000)
      return `${item.id}의 답변을 확인해주세요.`;
    else if (
      ['single', 'score'].includes(item.type) &&
      !item.options.includes(v)
    )
      return `${item.id}의 선택 항목을 확인해주세요.`;
    if (
      item.type === 'phone' &&
      typeof v === 'string' &&
      !isValidPhoneNumber(v)
    )
      return '휴대전화 번호를 확인해주세요.';
    if (v === '기타 브랜드' && !String(a[item.id + '_other'] ?? '').trim())
      return `${item.id}의 브랜드명을 적어주세요.`;
    if (
      typeof a[item.id + '_other'] === 'string' &&
      String(a[item.id + '_other']).length > 1000
    )
      return `${item.id}의 기타 답변은 1,000자 이내로 적어주세요.`;
  }
  return '';
}
export function isValidPhoneNumber(value: string) {
  return /^(?:010\d{8}|01[16789]\d{7,8})$/.test(value.replace(/[-\s]/g, ''));
}
export function formatPhoneNumber(value: string) {
  if (!isValidPhoneNumber(value)) return value;
  const d = value.replace(/[-\s]/g, '');
  return `${d.slice(0, 3)}-${d.slice(3, -4)}-${d.slice(-4)}`;
}
