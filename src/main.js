import './assets/main.css';
import 'bootstrap/dist/css/bootstrap.css';
import './assets/base.css';

/*
 * 관리자 공통 스타일.
 *
 * AdminLayout 에서 부르면 관리자 화면에 들어간 뒤에야 로드되어,
 * 새로고침할 때 사용자 화면 색이 잠깐 보였다가 바뀐다.
 * 여기서 미리 불러 그 깜빡임을 없앤다.
 *
 * ★ bootstrap 뒤에 두어야 한다. 앞에 두면 bootstrap 이 덮는다.
 * ★ admin.css 는 :root 변수와 a- 클래스만 정의하고 body 나 태그 선택자를
 *   건드리지 않으므로, 여기서 불러도 사용자 화면에는 영향이 없다.
 */
import './assets/admin.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);

/*
 * 라우터가 첫 경로를 정한 뒤에 화면을 붙인다.
 *
 * 그냥 mount 하면 App.vue 가 한 번 그려지는데,
 * 그 시점에는 route.meta 가 비어 있어 hideAppShell 이 undefined 다.
 * 그래서 관리자 화면인데도 DefaultLayout 이 먼저 뜨고
 * 사용자 헤더와 「청년타파」가 잠깐 보였다가 사라진다.
 *
 * isReady() 를 기다리면 그 한 프레임이 아예 없어진다.
 */
router.isReady().then(() => {
  app.mount('#app');
});