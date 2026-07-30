import axios from "axios";

const api = axios.create({
  baseURL: "/api/benefit",
  timeout: 10000,
});

export const getBenefitCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const getBenefit = async (params = {}) => {
  const response = await api.get("", {
    params,
  });

  return response.data;
};
