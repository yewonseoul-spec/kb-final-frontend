import BenefitSearchPage from '@/pages/benefit/BenefitSearchPage.vue';
import BenefitResultPage from '@/pages/benefit/BenefitResultPage.vue';
import BenefitDetailPage from '@/pages/benefit/BenefitDetailPage.vue';
import BenefitMainPage from '@/pages/benefit/BenefitMainPage.vue';

export default [
  {
    path: '/benefit/search',
    name: 'BenefitSearch',
    component: BenefitSearchPage,
    meta: {
      title: '혜택 검색',
    },
  },
  {
    path: '/benefit/result',
    name: 'BenefitResult',
    component: BenefitResultPage,
    meta: {
      title: '검색 결과',
    },
  },

  {
    path: '/benefit/detail/:benefitNo',
    name: 'benefit-detail',
    component: BenefitDetailPage,
    props: true,
    meta: {
      title: '혜택 상세',
    },
  },

  {
    path: '/benefit',
    name: 'benefit-main',
    component: BenefitMainPage,
    meta: {
      title: '혜택',
    },
  },
];
