/**
 * 평행세계 정의
 * 세 세계는 계산축 세 종류와 1:1로 대응하고, 네 번째는 셋을 조합한다.
 * 역사 배경은 실제 기록이고 내게 걸리는 충격은 명시적인 가정이다.
 * 둘을 섞지 않기 위해 history 와 stress 를 분리해 둔다.
 *
 * 충격 값은 화면이 서버로 직접 보낸다.
 *   expenseRate    생활밀접 지출 증가 비율
 *   incomeRate     소득 감소 비율
 *   fixedExpense   카테고리와 무관한 정액 월 지출 증가
 *   oneTimeAmount  일회성 충격 금액
 */
export const WORLDS = [
  {
    code: 'INFLATION',
    year: '2022',
    label: 'INFLATION',
    name: '고물가의 시대',
    summary: '생활비 압박',
    theme: 'amber',
    physics: 'SPREAD',
    line: '가격이 한 번에 폭발하지 않아도 생활 곳곳에서 조금씩 새어나갑니다',

    history: {
      title: '2022년 고물가',
      body: '생활물가가 크게 올랐던 시기입니다',
      metric: '생활물가 전년동월 +7.4%',
      source: '국가데이터처 · 2022년 6월',
      disclaimer: '',
    },

    stress: {
      question: '이 시대의 물가가 지금 내 지출에 온다면?',
      note: '+20%와 +30%는 실제 역사값이 아니라 체험용 가정입니다',
      options: [
        { key: 'REAL', label: '+7.4%', note: '2022년 6월 실제 기록', real: true,
          shock: { expenseRate: 0.074 } },
        { key: 'MID', label: '+20%', note: '가상 스트레스',
          shock: { expenseRate: 0.20 } },
        { key: 'HIGH', label: '+30%', note: '가상 스트레스',
          shock: { expenseRate: 0.30 } },
      ],
    },
  },

  {
    code: 'INCOME',
    year: '1998',
    label: 'FINANCIAL CRISIS',
    name: '외환위기의 시대',
    summary: '소득 충격',
    theme: 'steel',
    physics: 'CUT',
    line: '소득 흐름이 줄어들면 내 통장이 버텨주는 시간이 크게 달라집니다',

    history: {
      title: '1998년 외환위기',
      body: '고용 불안이 크게 높아진 시대였습니다',
      metric: '연간 실업률 6.8% · 전년 대비 4.2%p 상승',
      source: 'KDI 한국개발연구원',
      disclaimer: '시대 배경이며 내 소득 계산에는 사용되지 않습니다',
    },

    stress: {
      question: '이런 환경에서 내 등록 월소득이 줄어든다면?',
      note: '실제 그해의 임금 변동률이 아니라 체험용 가정입니다',
      options: [
        { key: 'LOW', label: '20% 감소', note: '가상 스트레스',
          shock: { incomeRate: 0.20 } },
        { key: 'MID', label: '절반 감소', note: '가상 스트레스',
          shock: { incomeRate: 0.50 } },
        { key: 'HIGH', label: '전액 상실', note: '등록 월소득 전부',
          shock: { incomeRate: 1.0 } },
      ],
    },
  },

  {
    code: 'MEDICAL',
    year: '1665',
    label: 'PLAGUE YEAR',
    name: '런던 대역병',
    summary: '돌발 의료비',
    theme: 'sepia',
    physics: 'HIT',
    line: '한 번의 지출은 잔액을 즉시 흔들고, 회복이 길어지면 매달을 잠식합니다',

    history: {
      title: '1665년 런던',
      body: '도시 전체가 감염병의 충격을 겪었던 시대입니다',
      metric: 'The Great Plague of London',
      source: 'London · 1665',
      disclaimer: '시대 배경이며 아래 금액은 그 시대의 치료비가 아닙니다',
    },

    stress: {
      question: '현대의 내가 예상하지 못한 의료비를 부담한다면?',
      note: '오늘의 내 통장에 적용해보는 가상 의료비입니다',
      options: [
        { key: 'LOW', label: '50만원', note: '한 번으로 끝남',
          shock: { oneTimeAmount: 500000 } },
        { key: 'MID', label: '100만원 + 월 20만원', note: '치료가 이어짐',
          shock: { oneTimeAmount: 1000000, fixedExpense: 200000 } },
        { key: 'HIGH', label: '200만원 + 월 50만원', note: '회복이 길어짐',
          shock: { oneTimeAmount: 2000000, fixedExpense: 500000 } },
      ],
    },
  },

  {
    code: 'CONVERGE',
    year: 'YEAR —',
    label: 'FINAL SHIFT',
    name: '기록 밖의 세계',
    summary: '세 충격이 한꺼번에',
    theme: 'violet',
    physics: 'CONVERGE',
    boss: true,
    line: '세 가지가 동시에 오면 버틸 수 있는 시간이 크게 줄어듭니다',

    history: {
      title: '기록 밖의 세계',
      body: '이 세계는 특정 실제 연도를 재현하지 않습니다',
      metric: 'THE CONVERGENCE',
      source: '가상 복합 세계',
      disclaimer: '앞서 체험한 금융 충격들을 하나의 시나리오로 조합합니다',
    },

    /** 축을 직접 고른다. 서로 다른 축을 두 개 이상 골라야 한다 */
    combine: {
      question: '어떤 충격을 함께 걸어볼까요?',
      note: '서로 다른 충격을 두 개 이상 고르면 체험할 수 있습니다',
      axes: [
        { key: 'expense', label: '생활물가 상승', unit: 'rate',
          steps: [
            { label: '+10%', shock: { expenseRate: 0.10 } },
            { label: '+20%', shock: { expenseRate: 0.20 } },
            { label: '+30%', shock: { expenseRate: 0.30 } },
          ] },
        { key: 'income', label: '소득 감소', unit: 'rate',
          steps: [
            { label: '20% 감소', shock: { incomeRate: 0.20 } },
            { label: '절반 감소', shock: { incomeRate: 0.50 } },
            { label: '전액 상실', shock: { incomeRate: 1.0 } },
          ] },
        { key: 'medical', label: '돌발 의료비', unit: 'amount',
          steps: [
            { label: '50만원', shock: { oneTimeAmount: 500000 } },
            { label: '100만원 + 월 20만원',
              shock: { oneTimeAmount: 1000000, fixedExpense: 200000 } },
            { label: '200만원 + 월 50만원',
              shock: { oneTimeAmount: 2000000, fixedExpense: 500000 } },
          ] },
      ],
    },
  },
]

/** 세계 코드로 정의를 찾는다 */
export function findWorld(code) {
  return WORLDS.find((world) => world.code === code) || null
}

/** 고른 축들의 충격 값을 하나로 합친다 */
export function mergeShock(shocks) {
  return shocks.reduce((acc, s) => ({
    expenseRate: acc.expenseRate || s.expenseRate || null,
    incomeRate: acc.incomeRate || s.incomeRate || null,
    fixedExpense: (acc.fixedExpense || 0) + (s.fixedExpense || 0),
    oneTimeAmount: (acc.oneTimeAmount || 0) + (s.oneTimeAmount || 0),
  }), {})
}