import axios from "axios";

const api = axios.create({
  baseURL: "/api/benefit",
  timeout: 10000,
});

//혜택목록 조회
export const getBenefit = async (params = {}) => {
  const response = await api.get("", {
    params,
  });

  return response.data;
};

//혜택 카테고리 조회
export const getBenefitCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

//혜택 지역 조회
export const getBenefitRegions = async (parentRegionCode = null) => {
  const response = await api.get("/regions", {
    params: parentRegionCode ? { parentRegionCode } : {},
  });

  return response.data;
};

//전공 조회

export const getBenefitMajors = async () => {
  const response = await api.get("/majors");
  return response.data;
};

//학력 조회
export const getBenefitSchools = async () => {
  const response = await api.get("/schools");
  return response.data;
};

// 직업 조회
export const getBenefitJobs = async () => {
  const response = await api.get('/jobs')
  return response.data
}

// 혼인 여부 조회
export const getBenefitMarriage = async () => {
  const response = await api.get('/marriage')
  return response.data
}

// 추천 검색어 조회
export const getRecommendedKeywords = async () => {
  const response = await api.get(
    "/search/recommended",
  );

  return response.data;
};

// 최근 검색어 조회
export const getRecentKeywords = async () => {
  const response = await api.get(
    "/search/recent",
  );

  return response.data;
};

// 최근 검색어 저장
export const saveRecentKeyword = async (
  keyword,
) => {
  await api.post("/search/recent", {
    keyword,
  });
};

// 최근 검색어 한 개 삭제
export const deleteRecentKeyword = async (
  keyword,
) => {
  await api.delete("/search/recent", {
    params: {
      keyword,
    },
  });
};

// 최근 검색어 전체 삭제
export const deleteAllRecentKeywords =
  async () => {
    await api.delete("/search/recent/all");
  };

  // 혜택 상세 조회
export const getBenefitDetail = async (
  benefitNo,
) => {
  const response = await api.get(
    `/${benefitNo}`,
  );

  return response.data;
};
