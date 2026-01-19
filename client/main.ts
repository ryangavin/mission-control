import { mount } from 'svelte'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './app.css'
import './styles/variables.css'
import './styles/utilities.css'
import './styles/buttons.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
