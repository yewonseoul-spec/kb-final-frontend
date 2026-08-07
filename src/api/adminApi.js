import instance from '@/api';

const BASE_URL = '/api/admin';

export default {
  // ADMIN-01 대시보드 — 통계 카드 5종 + 최근 동기화 5건 + 마감 임박 5건
  async getDashboard() {
    const { data } = await instance.get(`${BASE_URL}/dashboard`);
    return data;
  },

  // ADMIN-02 혜택 목록 — 조건은 전부 선택. 안 주면 전체를 최신 등록순으로
  async getBenefits(params) {
    const { data } = await instance.get(`${BASE_URL}/benefits`, { params });
    return data;
  },

  // ADMIN-02 혜택 상세
  async getBenefitDetail(benefitNo) {
    const { data } = await instance.get(`${BASE_URL}/benefits/${benefitNo}`);
    return data;
  },

  // ADMIN-02 활성 상태 변경 (Y/N)
  // 물리 삭제는 FK 제약으로 불가능해 상태 변경만 제공한다
  async changeBenefitActive(benefitNo, isActive) {
    const { data } = await instance.patch(
        `${BASE_URL}/benefits/${benefitNo}/active`,
        null,
        { params: { isActive } },
    );
    return data;
  },

  // ADMIN-03 동기화 로그 목록
  async getSyncLogs(params) {
    const { data } = await instance.get(`${BASE_URL}/synclog`, { params });
    return data;
  },

  // ADMIN-03 특정 동기화가 처리한 혜택 건별 내역
  async getSyncLogDetails(logNo) {
    const { data } = await instance.get(`${BASE_URL}/synclog/${logNo}/details`);
    return data;
  },

  // ADMIN-01 기간별 동기화 실행
  // 기준은 정책의 최초등록일(frst_reg_dt)이며 신청 기간이 아니다
  // memberNo 는 보내지 않는다. 서버가 토큰에서 채운다
  async syncByPeriod(startDate, endDate) {
    const { data } = await instance.post(`${BASE_URL}/sync/period`, null, {
      params: { startDate, endDate },
      timeout: 180000,
    });
    return data;
  },
};