/**
 * 베베숲 고객 경험 설문 Google Apps Script (2026 최신 31개 문항 완전 초기화 & 연동 엔진)
 * 스프레드시트 ID: 1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s
 */

const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
const RESPONSE_SHEET = '베베숲_응답';
const DICTIONARY_SHEET = '베베숲_문항사전';
const SUMMARY_SHEET = '베베숲_분석_종합';
const DETAIL_SHEET = '베베숲_응답_상세';

// 최신 31개 문항 전체 메타데이터
const LATEST_QUESTIONS = [
  {
    "id": "Q1",
    "section": 0,
    "title": "물티슈를 주로 누구를 위해 사용하시나요?",
    "type": "multi",
    "required": true,
    "options": [
      "임신·출산 준비",
      "0~12개월 아이",
      "13~36개월 아이",
      "4세 이상 자녀",
      "1인 가구 (자취/본인 전용)",
      "성인 (가족 공용)",
      "반려동물",
      "기타"
    ],
    "max": 2
  },
  {
    "id": "Q2",
    "section": 0,
    "title": "물티슈를 주로 어디에 가장 많이 사용하시나요?",
    "type": "multi",
    "required": true,
    "max": 2,
    "hint": "가장 주된 사용 목적 최대 2개를 선택해주세요.",
    "options": [
      "기저귀 교체 및 배변 뒤처리",
      "아이 얼굴·입가·손 닦기",
      "외출·어린이집 등 외부 활동",
      "집안·차량 가벼운 일상 청소",
      "성인 일상생활 위생",
      "반려동물 케어",
      "기타"
    ]
  },
  {
    "id": "Q3",
    "section": 0,
    "title": "물티슈 한 팩(70~80매 기준)을 보통 며칠 동안 사용하시나요?",
    "type": "single",
    "required": true,
    "options": [
      "하루에 2팩 이상",
      "하루에 1팩",
      "약 2일",
      "약 3~4일",
      "일주일 이상"
    ]
  },
  {
    "id": "Q4",
    "section": 1,
    "title": "현재 가장 자주 사용하는 물티슈 브랜드는 무엇인가요?",
    "type": "single",
    "required": true,
    "options": [
      "베베숲",
      "브라운",
      "페넬로페",
      "순둥이",
      "앙블랑",
      "슈퍼대디",
      "달곰이",
      "보솜이",
      "크리넥스",
      "쿠팡 PB(탐사/코멧 등)",
      "기타 브랜드"
    ]
  },
  {
    "id": "Q5",
    "section": 1,
    "title": "그전에는 어떤 브랜드를 가장 자주 사용하셨나요?",
    "type": "single",
    "required": true,
    "options": [
      "지금과 같은 브랜드",
      "이전에 사용한 브랜드 없음",
      "베베숲",
      "브라운",
      "페넬로페",
      "순둥이",
      "앙블랑",
      "슈퍼대디",
      "달곰이",
      "보솜이",
      "크리넥스",
      "쿠팡 PB(탐사/코멧 등)",
      "기타 브랜드",
      "기억나지 않음"
    ]
  },
  {
    "id": "Q6",
    "section": 1,
    "title": "지금 사용하는 브랜드로 바꾸거나 정착하신 가장 큰 이유는 무엇인가요?",
    "type": "single",
    "required": true,
    "options": [
      "두께(평량)가 더 도톰해서",
      "아기 피부에 더 순하고 트러블이 없어서",
      "가격/할인/가성비가 더 좋아서",
      "원단이 더 부드러워서",
      "성분과 안전성 신뢰도가 높아서",
      "한 장씩 쏙쏙 잘 뽑혀서",
      "주변/맘카페/지인 추천으로",
      "원하는 수분감(촉촉함)이 딱 맞아서",
      "기타"
    ]
  },
  {
    "id": "Q7",
    "section": 1,
    "title": "현재 여러 물티슈 브랜드를 함께 사용하시나요?",
    "type": "single",
    "required": true,
    "options": [
      "네, 2개 이상의 브랜드를 용도나 상황에 따라 함께 씁니다",
      "아니오, 현재 주로 쓰는 한 브랜드만 계속 씁니다"
    ]
  },
  {
    "id": "Q8",
    "section": 1,
    "title": "여러 브랜드를 함께 사용하는 이유는 무엇인가요?",
    "type": "multi",
    "required": true,
    "hint": "해당하는 항목을 모두 선택해주세요.",
    "options": [
      "아기 피부/엉덩이용과 집안 청소/막쓰는 용도를 나누려고",
      "외출/휴대용과 집에서 쓰는 거치용을 다르게 쓰려고",
      "가격이 저렴한 제품과 프리미엄 제품을 번갈아 쓰려고",
      "선물 받거나 이벤트로 받은 제품이 있어서",
      "특가/핫딜이 뜰 때마다 다른 브랜드를 사서",
      "어린이집/유치원 보낼 제품과 집에서 쓸 제품을 분리하려고",
      "브랜드별 차이를 크게 못 느껴서",
      "기타"
    ],
    "max": 2
  },
  {
    "id": "Q8-1",
    "section": 1,
    "title": "베베숲 외에 함께 사용 중인 다른 물티슈 제품은 무엇인가요?",
    "type": "text",
    "required": true,
    "hint": "브랜드명과 라인명을 편하게 적어주세요. (예: 쿠팡 탐사, 브라운 네이처 등)"
  },
  {
    "id": "Q8-channel",
    "section": 1,
    "title": "물티슈는 주로 어떤 채널에서 가장 자주 구매하시나요?",
    "type": "single",
    "required": true,
    "options": [
      "쿠팡 (로켓배송/와우)",
      "네이버 브랜드스토어 (스마트스토어)",
      "베베숲 공식 자사몰",
      "오픈마켓 (G마켓/11번가/옥션/SSG 등)",
      "카카오 쇼핑 / 선물하기",
      "대형마트 / 창고형 할인점(이마트, 트레이더스, 코스트코 등)",
      "다이소 / 편의점",
      "기타"
    ]
  },
  {
    "id": "Q9",
    "section": 2,
    "title": "처음 물티슈를 살 때 가장 중요하게 본 것은 무엇인가요?",
    "type": "multi",
    "required": true,
    "max": 2,
    "hint": "가장 중요했던 기준 최대 2개를 선택해주세요.",
    "options": [
      "두께(평량)감",
      "성분 안전성 / 무자극 인증",
      "가격 및 가성비",
      "원단의 부드러움",
      "한 장씩 잘 뽑히는 팝업성",
      "브랜드 인지도 및 1등 신뢰도",
      "적당한 수분감",
      "주변 지인 / 맘카페 추천",
      "기타"
    ]
  },
  {
    "id": "Q10",
    "section": 2,
    "title": "처음 물티슈를 살 때 제품 정보를 따로 알아보셨나요?",
    "type": "single",
    "required": true,
    "options": [
      "검색해서 꼼꼼히 비교해봤다",
      "주변 추천이나 인기 순위만 대략 보고 샀다",
      "그냥 익숙하거나 눈에 띄는 브랜드를 샀다",
      "기타"
    ]
  },
  {
    "id": "Q11",
    "section": 2,
    "title": "제품 정보를 찾고 비교하는 과정은 어떠셨나요?",
    "type": "single",
    "required": true,
    "options": [
      "매우 쉬움",
      "비교적 쉬운 편",
      "보통",
      "어려운 편",
      "매우 어려움"
    ]
  },
  {
    "id": "Q12",
    "section": 2,
    "title": "어떤 점이 가장 어려우셨나요?",
    "type": "multi",
    "required": true,
    "options": [
      "어떤 제품이 나에게 맞는지 몰라서",
      "제품 종류(라인업)가 너무 많아서",
      "제품마다 뭐가 다른지 몰라서",
      "제품 이름이나 패키지 디자인이 비슷비슷해서 헷갈려서",
      "성분이나 원단 설명이 어려워서",
      "두께(평량)나 사용감을 예상하기 어려워서",
      "가격이 왜 다른지 알기 어려워서",
      "원하는 정보를 찾기 어려워서",
      "기타"
    ],
    "max": 2
  },
  {
    "id": "Q13",
    "section": 3,
    "title": "현재 베베숲 물티슈를 어떤 패턴으로 이용하고 계신가요?",
    "type": "single",
    "required": true,
    "options": [
      "메인 물티슈로 매일 꾸준히 사용 중이다",
      "다른 브랜드와 함께 상황에 따라 쓰고 있다",
      "최근에 처음 구매해서 사용해보고 있는 중이다",
      "예전에 쓰다가 최근에 다시 재구매했다",
      "가끔 특가나 행사가 있을 때 주로 구매한다",
      "기타"
    ]
  },
  {
    "id": "Q14",
    "section": 3,
    "title": "현재 또는 가장 최근에 구매하여 사용 중인 베베숲 제품을 알려주세요.",
    "type": "text",
    "required": true,
    "hint": "정확한 제품명을 몰라도 괜찮습니다. 제품명, 패키지 색상(파란색, 갈색 등) 또는 기억나는 특징을 편하게 적어주세요."
  },
  {
    "id": "Q15",
    "section": 3,
    "title": "실제로 구매할 때 비교하거나 헷갈렸던 베베숲 제품이 있다면 알려주세요.",
    "type": "text",
    "required": true,
    "hint": "예: '시그니처 블루랑 블랙 차이가 헷갈렸다', '라인업이 너무 많아 차이를 잘 모르겠다' 등"
  },
  {
    "id": "Q16",
    "section": 3,
    "title": "베베숲을 사용하면서 특히 만족하신 점은 무엇인가요?",
    "type": "multi",
    "required": true,
    "max": 2,
    "hint": "가장 만족스러운 점 최대 2개를 선택해주세요.",
    "options": [
      "도톰한 두께감과 찢어지지 않는 짱짱함",
      "피부 발진 없이 순하고 안전한 성분",
      "부드러운 프리미엄 원단 감촉",
      "한 장씩 딸려 나오지 않고 쏙쏙 뽑힘",
      "마르지 않는 적당한 수분감",
      "안심할 수 있는 브랜드 신뢰도",
      "가격 대비 우수한 품질",
      "기타"
    ]
  },
  {
    "id": "Q17",
    "section": 3,
    "title": "베베숲을 사용하면서 불편하거나 아쉬웠던 점은 무엇인가요?",
    "type": "multi",
    "required": true,
    "max": 2,
    "hint": "가장 아쉬웠던 점 최대 2개를 선택해주세요.",
    "options": [
      "가격이 다소 비싸게 느껴짐",
      "라인업 종류가 너무 많고 차이를 알기 어려움",
      "원단이 늘어나거나 변형됨",
      "마지막 장까지 쓰기 전에 수분이 마름",
      "가끔 두 장 이상 딸려 나옴",
      "원단이 생각보다 덜 부드러움",
      "특별히 아쉬운 점 없음",
      "기타"
    ]
  },
  {
    "id": "Q18",
    "section": 3,
    "title": "베베숲을 가족이나 지인에게 추천할 가능성은 얼마나 되나요?",
    "type": "score",
    "required": true,
    "hint": "0점(전혀 추천하지 않음) ~ 10점(적극 추천함)",
    "options": [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10"
    ]
  },
  {
    "id": "Q19",
    "section": 3,
    "title": "그렇게 추천 점수를 주신 가장 큰 이유는 무엇인가요?",
    "type": "text",
    "required": true,
    "hint": "좋았던 점이나 솔직히 아쉬웠던 이유를 편하게 적어주세요."
  },
  {
    "id": "Q20",
    "section": 4,
    "title": "현재 아기 스킨케어(로션/크림/바스)나 세탁세제는 어떤 브랜드를 주로 이용하시나요? 그 브랜드를 고집하시는 이유는 무엇인가요?",
    "type": "text",
    "required": true,
    "hint": "예: 몽***(성분이 안심돼서), 블***(향이 좋아서), 아**, 레*** 등 솔직하게 적어주세요. (고집하는 브랜드가 없다면 '해당 없음' 또는 편하게 적어주셔도 좋습니다.)"
  },
  {
    "id": "Q20-adult",
    "section": 4,
    "title": "현재 일상/가정에서 주로 이용하시는 바디케어나 세탁세제는 어떤 브랜드인가요? 그 브랜드를 고집하시는 이유는 무엇인가요?",
    "type": "text",
    "required": true,
    "hint": "예: 향이 좋아서, 성분이 순해서, 가성비 등 솔직하게 적어주세요. (고정된 브랜드가 없으시면 '해당 없음'으로 편하게 적어주셔도 좋습니다.)"
  },
  {
    "id": "Q21",
    "section": 4,
    "title": "\"베베숲에서 아기 스킨케어(로션/크림), 세탁세제, 젖병세제 등도 만든다\"고 했을 때 어떤 생각이 먼저 드시나요?",
    "type": "single",
    "required": true,
    "options": [
      "베베숲이니까 성분 믿고 한번 사보고 싶다",
      "물티슈 1등 이미지가 너무 강해서, 화장품이나 세제는 전문성이 조금 망설여진다",
      "베베숲에 물티슈 외에 다른 제품이 있다는 사실을 오늘 처음 알았다",
      "이미 정착해서 쓰고 있는 타 브랜드가 확고해서 굳이 바꿀 생각이 안 든다",
      "기타"
    ]
  },
  {
    "id": "Q21-adult",
    "section": 4,
    "title": "\"베베숲에서 온가족 스킨케어(로션/바디), 세탁세제, 주방세제 등 일상 생활용품도 만든다\"고 했을 때 어떤 생각이 먼저 드시나요?",
    "type": "single",
    "required": true,
    "options": [
      "베베숲이니까 순하고 안전할 것 같아 써보고 싶다",
      "아기 물티슈 브랜드 이미지가 강해서 성인용 생활용품은 낯설게 느껴진다",
      "베베숲에 물티슈 외에 다른 제품이 있다는 사실을 오늘 처음 알았다",
      "이미 마트나 쿠팡에서 사 쓰던 기존 브랜드가 편하다",
      "기타"
    ]
  },
  {
    "id": "Q22",
    "section": 4,
    "title": "베베숲에서 스킨케어, 세제 등 다양한 제품도 판매 중입니다. 전용 할인 쿠폰을 드린다면 구매해 보실 의향이 있으신가요?",
    "type": "single",
    "required": true,
    "options": [
      "쿠폰이 있다면 꼭 구매해서 써보고 싶다",
      "기존에 쓰던 제품이 떨어졌을 때 마침 할인 쿠폰이 있다면 고려해보겠다",
      "쿠폰을 주더라도 굳이 새로운 제품을 살 생각은 없다",
      "물티슈만 필요하다"
    ]
  },
  {
    "id": "Q23",
    "section": 4,
    "title": "앞으로 베베숲이 '물티슈 1등'을 넘어 더 사랑받는 브랜드가 되기 위해 꼭 바뀌어야 할 점이나, 만들어주었으면 하는 신제품을 솔직하게 들려주세요.",
    "type": "text",
    "required": true,
    "hint": "육아용품뿐만 아니라 1인 가구/일상에 꼭 필요한 제품(소포장/휴대용 물티슈, 클렌징, 위생용품 등) 아이디어도 베베숲의 성장에 큰 힘이 됩니다."
  },
  {
    "id": "Q24-interview",
    "section": 5,
    "title": "베베숲의 제품 개발과 브랜드 변화를 위해, 약 30분간 솔직한 생각을 들려주실 1:1 심층 인터뷰에도 참여해 주실 수 있나요?",
    "type": "single",
    "required": true,
    "hint": "🎁 인터뷰 참여 고객님께는 설문 경품 외에 추가로 프리미엄 선물 세트(시그니처 블랙 20팩 1BOX / 아기 세제 세트 / 신생아 스킨케어 4종 세트 중 택1)를 선물로 드립니다.",
    "options": [
      "네, 심층 인터뷰에도 적극 참여하고 싶습니다",
      "인터뷰는 어렵고, 설문 경품 추첨에만 참여하겠습니다"
    ]
  },
  {
    "id": "Q25-name",
    "section": 5,
    "title": "성함을 알려주세요.",
    "type": "text",
    "required": true
  },
  {
    "id": "Q26-phone",
    "section": 5,
    "title": "경품 추첨 및 인터뷰 안내를 받으실 휴대전화 번호를 입력해주세요.",
    "type": "phone",
    "required": true,
    "hint": "숫자만 입력하시면 010-XXXX-XXXX 형태로 자동 정리됩니다."
  },
  {
    "id": "Q27-agree",
    "section": 5,
    "title": "경품 추첨 및 안내를 위한 개인정보 수집·이용에 동의하시나요?",
    "type": "single",
    "required": true,
    "options": [
      "동의합니다",
      "동의하지 않습니다"
    ]
  }
];

// 전체 컬럼 헤더 목록 (107개 컬럼)
const LATEST_HEADERS = ["응답ID","제출일시","설문버전","고객유형","Q1","Q1_기타","Q1 | 임신·출산 준비","Q1 | 0~12개월 아이","Q1 | 13~36개월 아이","Q1 | 4세 이상 자녀","Q1 | 1인 가구 (자취/본인 전용)","Q1 | 성인 (가족 공용)","Q1 | 반려동물","Q1 | 기타","Q2","Q2_기타","Q2 | 기저귀 교체 및 배변 뒤처리","Q2 | 아이 얼굴·입가·손 닦기","Q2 | 외출·어린이집 등 외부 활동","Q2 | 집안·차량 가벼운 일상 청소","Q2 | 성인 일상생활 위생","Q2 | 반려동물 케어","Q2 | 기타","Q3","Q4","Q4_기타","Q5","Q5_기타","Q6","Q6_기타","Q7","Q8","Q8_기타","Q8 | 아기 피부/엉덩이용과 집안 청소/막쓰는 용도를 나누려고","Q8 | 외출/휴대용과 집에서 쓰는 거치용을 다르게 쓰려고","Q8 | 가격이 저렴한 제품과 프리미엄 제품을 번갈아 쓰려고","Q8 | 선물 받거나 이벤트로 받은 제품이 있어서","Q8 | 특가/핫딜이 뜰 때마다 다른 브랜드를 사서","Q8 | 어린이집/유치원 보낼 제품과 집에서 쓸 제품을 분리하려고","Q8 | 브랜드별 차이를 크게 못 느껴서","Q8 | 기타","Q8-1","Q8-channel","Q8-channel_기타","Q9","Q9_기타","Q9 | 두께(평량)감","Q9 | 성분 안전성 / 무자극 인증","Q9 | 가격 및 가성비","Q9 | 원단의 부드러움","Q9 | 한 장씩 잘 뽑히는 팝업성","Q9 | 브랜드 인지도 및 1등 신뢰도","Q9 | 적당한 수분감","Q9 | 주변 지인 / 맘카페 추천","Q9 | 기타","Q10","Q10_기타","Q11","Q12","Q12_기타","Q12 | 어떤 제품이 나에게 맞는지 몰라서","Q12 | 제품 종류(라인업)가 너무 많아서","Q12 | 제품마다 뭐가 다른지 몰라서","Q12 | 제품 이름이나 패키지 디자인이 비슷비슷해서 헷갈려서","Q12 | 성분이나 원단 설명이 어려워서","Q12 | 두께(평량)나 사용감을 예상하기 어려워서","Q12 | 가격이 왜 다른지 알기 어려워서","Q12 | 원하는 정보를 찾기 어려워서","Q12 | 기타","Q13","Q13_기타","Q14","Q15","Q16","Q16_기타","Q16 | 도톰한 두께감과 찢어지지 않는 짱짱함","Q16 | 피부 발진 없이 순하고 안전한 성분","Q16 | 부드러운 프리미엄 원단 감촉","Q16 | 한 장씩 딸려 나오지 않고 쏙쏙 뽑힘","Q16 | 마르지 않는 적당한 수분감","Q16 | 안심할 수 있는 브랜드 신뢰도","Q16 | 가격 대비 우수한 품질","Q16 | 기타","Q17","Q17_기타","Q17 | 가격이 다소 비싸게 느껴짐","Q17 | 라인업 종류가 너무 많고 차이를 알기 어려움","Q17 | 원단이 늘어나거나 변형됨","Q17 | 마지막 장까지 쓰기 전에 수분이 마름","Q17 | 가끔 두 장 이상 딸려 나옴","Q17 | 원단이 생각보다 덜 부드러움","Q17 | 특별히 아쉬운 점 없음","Q17 | 기타","Q18","Q19","Q20","Q20-adult","Q21","Q21_기타","Q21-adult","Q21-adult_기타","Q22","Q23","Q24-interview","Q25-name","Q26-phone","Q27-agree"];

// 문항 사전 초기 데이터
const LATEST_DICT_ROWS = [["20261111","Q1","물티슈를 주로 누구를 위해 사용하시나요?","multi","[\"임신·출산 준비\",\"0~12개월 아이\",\"13~36개월 아이\",\"4세 이상 자녀\",\"1인 가구 (자취/본인 전용)\",\"성인 (가족 공용)\",\"반려동물\",\"기타\"]"],["20261111","Q2","물티슈를 주로 어디에 가장 많이 사용하시나요?","multi","[\"기저귀 교체 및 배변 뒤처리\",\"아이 얼굴·입가·손 닦기\",\"외출·어린이집 등 외부 활동\",\"집안·차량 가벼운 일상 청소\",\"성인 일상생활 위생\",\"반려동물 케어\",\"기타\"]"],["20261111","Q3","물티슈 한 팩(70~80매 기준)을 보통 며칠 동안 사용하시나요?","single","[\"하루에 2팩 이상\",\"하루에 1팩\",\"약 2일\",\"약 3~4일\",\"일주일 이상\"]"],["20261111","Q4","현재 가장 자주 사용하는 물티슈 브랜드는 무엇인가요?","single","[\"베베숲\",\"브라운\",\"페넬로페\",\"순둥이\",\"앙블랑\",\"슈퍼대디\",\"달곰이\",\"보솜이\",\"크리넥스\",\"쿠팡 PB(탐사/코멧 등)\",\"기타 브랜드\"]"],["20261111","Q5","그전에는 어떤 브랜드를 가장 자주 사용하셨나요?","single","[\"지금과 같은 브랜드\",\"이전에 사용한 브랜드 없음\",\"베베숲\",\"브라운\",\"페넬로페\",\"순둥이\",\"앙블랑\",\"슈퍼대디\",\"달곰이\",\"보솜이\",\"크리넥스\",\"쿠팡 PB(탐사/코멧 등)\",\"기타 브랜드\",\"기억나지 않음\"]"],["20261111","Q6","지금 사용하는 브랜드로 바꾸거나 정착하신 가장 큰 이유는 무엇인가요?","single","[\"두께(평량)가 더 도톰해서\",\"아기 피부에 더 순하고 트러블이 없어서\",\"가격/할인/가성비가 더 좋아서\",\"원단이 더 부드러워서\",\"성분과 안전성 신뢰도가 높아서\",\"한 장씩 쏙쏙 잘 뽑혀서\",\"주변/맘카페/지인 추천으로\",\"원하는 수분감(촉촉함)이 딱 맞아서\",\"기타\"]"],["20261111","Q7","현재 여러 물티슈 브랜드를 함께 사용하시나요?","single","[\"네, 2개 이상의 브랜드를 용도나 상황에 따라 함께 씁니다\",\"아니오, 현재 주로 쓰는 한 브랜드만 계속 씁니다\"]"],["20261111","Q8","여러 브랜드를 함께 사용하는 이유는 무엇인가요?","multi","[\"아기 피부/엉덩이용과 집안 청소/막쓰는 용도를 나누려고\",\"외출/휴대용과 집에서 쓰는 거치용을 다르게 쓰려고\",\"가격이 저렴한 제품과 프리미엄 제품을 번갈아 쓰려고\",\"선물 받거나 이벤트로 받은 제품이 있어서\",\"특가/핫딜이 뜰 때마다 다른 브랜드를 사서\",\"어린이집/유치원 보낼 제품과 집에서 쓸 제품을 분리하려고\",\"브랜드별 차이를 크게 못 느껴서\",\"기타\"]"],["20261111","Q8-1","베베숲 외에 함께 사용 중인 다른 물티슈 제품은 무엇인가요?","text","[]"],["20261111","Q8-channel","물티슈는 주로 어떤 채널에서 가장 자주 구매하시나요?","single","[\"쿠팡 (로켓배송/와우)\",\"네이버 브랜드스토어 (스마트스토어)\",\"베베숲 공식 자사몰\",\"오픈마켓 (G마켓/11번가/옥션/SSG 등)\",\"카카오 쇼핑 / 선물하기\",\"대형마트 / 창고형 할인점(이마트, 트레이더스, 코스트코 등)\",\"다이소 / 편의점\",\"기타\"]"],["20261111","Q9","처음 물티슈를 살 때 가장 중요하게 본 것은 무엇인가요?","multi","[\"두께(평량)감\",\"성분 안전성 / 무자극 인증\",\"가격 및 가성비\",\"원단의 부드러움\",\"한 장씩 잘 뽑히는 팝업성\",\"브랜드 인지도 및 1등 신뢰도\",\"적당한 수분감\",\"주변 지인 / 맘카페 추천\",\"기타\"]"],["20261111","Q10","처음 물티슈를 살 때 제품 정보를 따로 알아보셨나요?","single","[\"검색해서 꼼꼼히 비교해봤다\",\"주변 추천이나 인기 순위만 대략 보고 샀다\",\"그냥 익숙하거나 눈에 띄는 브랜드를 샀다\",\"기타\"]"],["20261111","Q11","제품 정보를 찾고 비교하는 과정은 어떠셨나요?","single","[\"매우 쉬움\",\"비교적 쉬운 편\",\"보통\",\"어려운 편\",\"매우 어려움\"]"],["20261111","Q12","어떤 점이 가장 어려우셨나요?","multi","[\"어떤 제품이 나에게 맞는지 몰라서\",\"제품 종류(라인업)가 너무 많아서\",\"제품마다 뭐가 다른지 몰라서\",\"제품 이름이나 패키지 디자인이 비슷비슷해서 헷갈려서\",\"성분이나 원단 설명이 어려워서\",\"두께(평량)나 사용감을 예상하기 어려워서\",\"가격이 왜 다른지 알기 어려워서\",\"원하는 정보를 찾기 어려워서\",\"기타\"]"],["20261111","Q13","현재 베베숲 물티슈를 어떤 패턴으로 이용하고 계신가요?","single","[\"메인 물티슈로 매일 꾸준히 사용 중이다\",\"다른 브랜드와 함께 상황에 따라 쓰고 있다\",\"최근에 처음 구매해서 사용해보고 있는 중이다\",\"예전에 쓰다가 최근에 다시 재구매했다\",\"가끔 특가나 행사가 있을 때 주로 구매한다\",\"기타\"]"],["20261111","Q14","현재 또는 가장 최근에 구매하여 사용 중인 베베숲 제품을 알려주세요.","text","[]"],["20261111","Q15","실제로 구매할 때 비교하거나 헷갈렸던 베베숲 제품이 있다면 알려주세요.","text","[]"],["20261111","Q16","베베숲을 사용하면서 특히 만족하신 점은 무엇인가요?","multi","[\"도톰한 두께감과 찢어지지 않는 짱짱함\",\"피부 발진 없이 순하고 안전한 성분\",\"부드러운 프리미엄 원단 감촉\",\"한 장씩 딸려 나오지 않고 쏙쏙 뽑힘\",\"마르지 않는 적당한 수분감\",\"안심할 수 있는 브랜드 신뢰도\",\"가격 대비 우수한 품질\",\"기타\"]"],["20261111","Q17","베베숲을 사용하면서 불편하거나 아쉬웠던 점은 무엇인가요?","multi","[\"가격이 다소 비싸게 느껴짐\",\"라인업 종류가 너무 많고 차이를 알기 어려움\",\"원단이 늘어나거나 변형됨\",\"마지막 장까지 쓰기 전에 수분이 마름\",\"가끔 두 장 이상 딸려 나옴\",\"원단이 생각보다 덜 부드러움\",\"특별히 아쉬운 점 없음\",\"기타\"]"],["20261111","Q18","베베숲을 가족이나 지인에게 추천할 가능성은 얼마나 되나요?","score","[\"0\",\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"10\"]"],["20261111","Q19","그렇게 추천 점수를 주신 가장 큰 이유는 무엇인가요?","text","[]"],["20261111","Q20","현재 아기 스킨케어(로션/크림/바스)나 세탁세제는 어떤 브랜드를 주로 이용하시나요? 그 브랜드를 고집하시는 이유는 무엇인가요?","text","[]"],["20261111","Q20-adult","현재 일상/가정에서 주로 이용하시는 바디케어나 세탁세제는 어떤 브랜드인가요? 그 브랜드를 고집하시는 이유는 무엇인가요?","text","[]"],["20261111","Q21","\"베베숲에서 아기 스킨케어(로션/크림), 세탁세제, 젖병세제 등도 만든다\"고 했을 때 어떤 생각이 먼저 드시나요?","single","[\"베베숲이니까 성분 믿고 한번 사보고 싶다\",\"물티슈 1등 이미지가 너무 강해서, 화장품이나 세제는 전문성이 조금 망설여진다\",\"베베숲에 물티슈 외에 다른 제품이 있다는 사실을 오늘 처음 알았다\",\"이미 정착해서 쓰고 있는 타 브랜드가 확고해서 굳이 바꿀 생각이 안 든다\",\"기타\"]"],["20261111","Q21-adult","\"베베숲에서 온가족 스킨케어(로션/바디), 세탁세제, 주방세제 등 일상 생활용품도 만든다\"고 했을 때 어떤 생각이 먼저 드시나요?","single","[\"베베숲이니까 순하고 안전할 것 같아 써보고 싶다\",\"아기 물티슈 브랜드 이미지가 강해서 성인용 생활용품은 낯설게 느껴진다\",\"베베숲에 물티슈 외에 다른 제품이 있다는 사실을 오늘 처음 알았다\",\"이미 마트나 쿠팡에서 사 쓰던 기존 브랜드가 편하다\",\"기타\"]"],["20261111","Q22","베베숲에서 스킨케어, 세제 등 다양한 제품도 판매 중입니다. 전용 할인 쿠폰을 드린다면 구매해 보실 의향이 있으신가요?","single","[\"쿠폰이 있다면 꼭 구매해서 써보고 싶다\",\"기존에 쓰던 제품이 떨어졌을 때 마침 할인 쿠폰이 있다면 고려해보겠다\",\"쿠폰을 주더라도 굳이 새로운 제품을 살 생각은 없다\",\"물티슈만 필요하다\"]"],["20261111","Q23","앞으로 베베숲이 '물티슈 1등'을 넘어 더 사랑받는 브랜드가 되기 위해 꼭 바뀌어야 할 점이나, 만들어주었으면 하는 신제품을 솔직하게 들려주세요.","text","[]"],["20261111","Q24-interview","베베숲의 제품 개발과 브랜드 변화를 위해, 약 30분간 솔직한 생각을 들려주실 1:1 심층 인터뷰에도 참여해 주실 수 있나요?","single","[\"네, 심층 인터뷰에도 적극 참여하고 싶습니다\",\"인터뷰는 어렵고, 설문 경품 추첨에만 참여하겠습니다\"]"],["20261111","Q25-name","성함을 알려주세요.","text","[]"],["20261111","Q26-phone","경품 추첨 및 인터뷰 안내를 받으실 휴대전화 번호를 입력해주세요.","phone","[]"],["20261111","Q27-agree","경품 추첨 및 안내를 위한 개인정보 수집·이용에 동의하시나요?","single","[\"동의합니다\",\"동의하지 않습니다\"]"]];

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

/**
 * 🚀 [1초 전체 초기화 및 새 양식 세팅 함수]
 * Apps Script 상단에서 'resetAndSetupFresh'를 선택하고 [▶ 실행]을 누르면
 * 기존 구형 데이터를 전부 지우고 최신 31개 문항 양식으로 즉시 깨끗하게 세팅합니다.
 */
function resetAndSetupFresh() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. [베베숲_응답] 시트 초기화
  const respSheet = getOrCreate(book, RESPONSE_SHEET);
  respSheet.clear();
  if (respSheet.getMaxColumns() < LATEST_HEADERS.length) {
    respSheet.insertColumnsAfter(respSheet.getMaxColumns(), LATEST_HEADERS.length - respSheet.getMaxColumns());
  }
  respSheet.getRange(1, 1, 1, LATEST_HEADERS.length).setValues([LATEST_HEADERS.map(safe)]);
  respSheet.setFrozenRows(1);
  const headerRange = respSheet.getRange(1, 1, 1, LATEST_HEADERS.length);
  headerRange.setBackground('#087768');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  respSheet.autoResizeColumns(1, Math.min(10, LATEST_HEADERS.length));

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
  dictSheet.getRange(2, 1, LATEST_DICT_ROWS.length, dictHeaders.length).setValues(LATEST_DICT_ROWS.map(r => r.map(safe)));
  dictSheet.autoResizeColumns(1, 4);
  dictSheet.setColumnWidth(5, 450);

  // 3. [베베숲_분석_종합] 시트 초기화
  refreshAnalysis(book, LATEST_QUESTIONS);

  // 4. [베베숲_응답_상세] 시트 초기화
  const detailSheet = getOrCreate(book, DETAIL_SHEET);
  detailSheet.clear();
  const excluded = new Set(['Q25-name', 'Q26-phone']);
  const detailQuestions = LATEST_QUESTIONS.filter(q => !excluded.has(q.id));
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

    const questions = Array.isArray(data.questions) && data.questions.length > 0 ? data.questions : LATEST_QUESTIONS;
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
    let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : LATEST_HEADERS;
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
  const qList = Array.isArray(questions) && questions.length > 0 ? questions : LATEST_QUESTIONS;
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
