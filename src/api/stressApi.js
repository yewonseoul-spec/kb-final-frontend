import instance from '@/api'

const BASE_URL = '/api/stress'

/**
 * 스트레스 테스트 API
 * 회원번호는 보내지 않는다. 서버가 토큰에서 꺼내 쓴다.
 */
export default {
  /**
   * 세계 목록을 조회한다
   */
  async getScenarios() {
    const { data } = await instance.get(`${BASE_URL}/scenarios`)
    return data
  },

  /**
   * 선택한 세계를 내 통장에 적용한 결과를 조회한다
   *
   * @param {string} scenarioCode INFLATION / RENT / MEDICAL / COMPLEX / JOB_LOSS
   * @param {string} shockLevel   LOW / MID / HIGH
   */
  async getResult(scenarioCode, shockLevel) {
    const { data } = await instance.post(`${BASE_URL}/result`, null, {
      params: { scenarioCode, shockLevel },
    })
    return data
  },
}