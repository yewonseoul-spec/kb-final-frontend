import instance from '@/api'

const BASE_URL = '/api/stress'

/**
 * 스트레스 테스트 API
 * 회원번호는 보내지 않는다. 서버가 토큰에서 꺼내 쓴다.
 * 세계와 강도의 정의는 화면이 가지고 있고 서버에는 충격 값만 보낸다.
 */
export default {
  /**
   * 결과를 계산한다
   *
   * @param {object} payload
   *   worldCode      세계 코드
   *   stageLabel     화면에 표시할 조건 문구
   *   expenseRate    생활밀접 지출 증가 비율 0~1
   *   incomeRate     소득 감소 비율 0~1
   *   fixedExpense   정액 월 지출 증가액
   *   oneTimeAmount  일회성 충격 금액
   *   adjustments    [{ categoryName, reductionRate }]
   */
  async getResult(payload) {
    const { data } = await instance.post(`${BASE_URL}/result`, {
      adjustments: [],
      ...payload,
    })
    return data
  },
}