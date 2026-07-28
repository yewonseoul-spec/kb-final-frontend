export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/auth/Login.vue'),
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: () => import('../pages/auth/SignUp.vue'),
  },
];
