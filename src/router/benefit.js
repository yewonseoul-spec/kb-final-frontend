import BenefitSearchPage from "@/pages/benefit/BenefitSearchPage.vue";
import BenefitResultPage from "@/pages/benefit/BenefitResultPage.vue";
import BenefitDetailPage from "@/pages/benefit/BenefitDetailPage.vue";

export default [
  {
    path: "/benefit/search",
    name: "BenefitSearch",
    component: BenefitSearchPage,
    meta: {
      title: "혜택 검색",
      headerType: "back",
      headerTitle: "혜택 검색",
    },
  },
  {
    path: "/benefit/result",
    name: "BenefitResult",
    component: BenefitResultPage,
    meta: {
      title: "검색 결과",
      headerType: "back",
      headerTitle: "검색 결과",
    },
  },

  {
    path: "/benefit/detail/:benefitNo",
    name: "benefit-detail",
    component: BenefitDetailPage,
    props: true,
    meta: {
      title: "혜택 상세",
      headerType: "back",
      headerTitle: "혜택 상세",
    },
  },
];
