import { createApp } from 'vue'
import './index.css'
import { Icon } from '@iconify/vue'
import mitt from 'mitt'
import type { MittEvent } from './utils/type'
import App from './App.vue'
const app = createApp(App)
const emitter = mitt<MittEvent>()
app.component('Icon', Icon)
app.config.globalProperties.$mitt = emitter
app.mount('#app')

declare module 'vue' {
  export interface ComponentCustomProperties {
    $mitt: typeof emitter
  }
}
