import Vue from 'vue'
import router from './router'
import Chat from './components/Chat'
import BackgroundSync from './components/BackgroundSync'

import VueMaterial from 'vue-material'
import VueRouter from 'vue-router'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default-dark.css' // This line here

import { MdButton, MdContent, MdTabs } from 'vue-material/dist/components'

Vue.config.productionTip = false

Vue.use(VueMaterial)
Vue.use(VueRouter)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: {BackgroundSync},
  render: h => h(Chat)
})

