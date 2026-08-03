import { computed, reactive } from "vue";

const defaults = () => ({
  categoryCode: "",
  categoryName: "전체",
  zipCd: "",
  provinceCode: "",
  provinceName: "전국",
  cityCode: "",
  cityName: "중분류",
  districtCode: "",
  districtName: "분류",
  plcyMajorCd: "",
  majorName: "전체",
  schoolCd: "",
  schoolName: "전체",
  jobCd: "",
  jobName: "전체",
  mrgSttsCd: "",
  marriageName: "전체",
});

export const useBenefitFilter = (route) => {
  const filter = reactive({
    categoryCode: route.query.categoryCode ?? "",
    categoryName: route.query.categoryName ?? "전체",
    zipCd: route.query.zipCd ?? "",
    provinceCode: route.query.provinceCode ?? "",
    provinceName: route.query.provinceName ?? "전국",
    cityCode: route.query.cityCode ?? "",
    cityName: route.query.cityName ?? "중분류",
    districtCode: route.query.districtCode ?? "",
    districtName: route.query.districtName ?? "분류",
    plcyMajorCd: route.query.plcyMajorCd ?? "",
    majorName: route.query.majorName ?? "전체",
    schoolCd: route.query.schoolCd ?? "",
    schoolName: route.query.schoolName ?? "전체",
    jobCd: route.query.jobCd ?? "",
    jobName: route.query.jobName ?? "전체",
    mrgSttsCd: route.query.mrgSttsCd ?? "",
    marriageName: route.query.marriageName ?? "전체",
  });

  const regionLabel = computed(() => {
    const names = [
      filter.provinceCode ? filter.provinceName : "",
      filter.cityCode ? filter.cityName : "",
      filter.districtCode ? filter.districtName : "",
    ].filter(Boolean);
    return names.join(" ") || "전국";
  });

  const activeFilters = computed(() => {
    const items = [];
    if (filter.categoryCode)
      items.push({ key: "category", label: filter.categoryName });
    if (filter.zipCd) items.push({ key: "region", label: regionLabel.value });
    if (filter.plcyMajorCd)
      items.push({ key: "major", label: filter.majorName });
    if (filter.schoolCd)
      items.push({ key: "school", label: filter.schoolName });
    if (filter.jobCd) items.push({ key: "job", label: filter.jobName });
    if (filter.mrgSttsCd)
      items.push({ key: "marriage", label: filter.marriageName });
    return items;
  });

  const apiParams = computed(() => ({
    categoryCode: filter.categoryCode || undefined,
    zipCd: filter.zipCd || undefined,
    plcyMajorCd: filter.plcyMajorCd || undefined,
    schoolCd: filter.schoolCd || undefined,
    jobCd: filter.jobCd || undefined,
    mrgSttsCd: filter.mrgSttsCd || undefined,
  }));

  const queryParams = computed(() => ({
    categoryCode: filter.categoryCode || undefined,
    categoryName: filter.categoryCode ? filter.categoryName : undefined,
    zipCd: filter.zipCd || undefined,
    provinceCode: filter.provinceCode || undefined,
    provinceName: filter.provinceCode ? filter.provinceName : undefined,
    cityCode: filter.cityCode || undefined,
    cityName: filter.cityCode ? filter.cityName : undefined,
    districtCode: filter.districtCode || undefined,
    districtName: filter.districtCode ? filter.districtName : undefined,
    plcyMajorCd: filter.plcyMajorCd || undefined,
    majorName: filter.plcyMajorCd ? filter.majorName : undefined,
    schoolCd: filter.schoolCd || undefined,
    schoolName: filter.schoolCd ? filter.schoolName : undefined,
    jobCd: filter.jobCd || undefined,
    jobName: filter.jobCd ? filter.jobName : undefined,
    marriageName: filter.mrgSttsCd ? filter.marriageName : undefined,
  }));

  const apply = (next) => Object.assign(filter, next);

  const clear = (key) => {
    if (key === "category")
      Object.assign(filter, { categoryCode: "", categoryName: "전체" });
    if (key === "region")
      Object.assign(filter, defaults(), {
        categoryCode: filter.categoryCode,
        categoryName: filter.categoryName,
        plcyMajorCd: filter.plcyMajorCd,
        majorName: filter.majorName,
        schoolCd: filter.schoolCd,
        schoolName: filter.schoolName,
        jobCd: filter.jobCd,
        jobName: filter.jobName,
        mrgSttsCd: filter.mrgSttsCd,
        marriageName: filter.marriageName,
      });
    if (key === "major")
      Object.assign(filter, { plcyMajorCd: "", majorName: "전체" });
    if (key === "school")
      Object.assign(filter, { schoolCd: "", schoolName: "전체" });
    if (key === "job") Object.assign(filter, { jobCd: "", jobName: "전체" });
    if (key === "marriage")
      Object.assign(filter, { mrgSttsCd: "", marriageName: "전체" });
  };

  return { filter, activeFilters, apiParams, queryParams, apply, clear };
};
