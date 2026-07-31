import BenefitSearchPage from '@/pages/benefit/BenefitSearchPage.vue'
import BenefitResultPage from '@/pages/benefit/BenefitResultPage.vue'

export default [
  {
    path: '/benefit/search',
    name: 'BenefitSearch',
    component: BenefitSearchPage,
  },
  {
    path: '/benefit/result',
    name: 'BenefitResult',
    component: BenefitResultPage,
  },
]