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
