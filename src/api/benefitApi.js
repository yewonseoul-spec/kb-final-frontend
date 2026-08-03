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
