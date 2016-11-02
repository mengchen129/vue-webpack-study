import Vue from 'vue';
import Header from './components/Header.vue';

Vue.component(Header.tagName, Header);

require('../sass/main.scss');

new Vue({
    el: 'body',
    data: {}
});