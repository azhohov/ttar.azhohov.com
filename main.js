import Vue, { createApp } from '@vue/compat';
import BootstrapVue from 'bootstrap-vue';
import TTARCalculator from './components/TTARCalculator.vue';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.use(BootstrapVue);
const app = createApp(TTARCalculator);
app.mount('#app');
